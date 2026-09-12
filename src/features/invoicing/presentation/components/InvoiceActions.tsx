/**
 * InvoiceActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Acciones disponibles para una factura individual.
 * Soporta dos modos de uso:
 *
 * 1. dropdown (para InvoiceTable / InvoiceCard — lista):
 *    <InvoiceActions invoiceId={id} invoiceStatus="draft" onView={...} onDelete={...} />
 *
 * 2. buttons (para InvoiceDetailPage):
 *    <InvoiceActions variant="buttons" invoiceId={id} invoiceStatus="stamped" fullInvoice={invoice} />
 *
 * Ubicación: src/features/invoicing/presentation/components/InvoiceActions.tsx
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { usePermissions, useRole } from "@shared/permissions";
import { ROLES } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Stamp,
  DollarSign,
  XCircle,
  Loader2,
  RefreshCw,
  Download,
  FileCode,
  Mail,
  ChevronDown,
} from "lucide-react";
import { canRegisterPayment } from "@boeltech/cfdi-domain";
import { useDeleteInvoice, useOpenInvoicePdf, useDownloadInvoiceXml } from "@features/invoicing/application";
import { parseInvoiceBillingScope, toInvoiceLike } from "@features/invoicing/domain";
import { useTrip } from "@features/trips/application";
import {
  describeStampApiError,
  useTripFiscalSheets,
} from "@features/trips/presentation/components/trip-fiscal";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { SubstituteInvoiceSheet } from "./SubstituteInvoiceSheet";
import { SendInvoiceDialog } from "./SendInvoiceDialog";
import type { InvoiceStatus, Invoice } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

const actionsCopy = invoicingCopy.detail.actions;
const sendCopy = invoicingCopy.send;

// ============================================================================
// TYPES
// ============================================================================

interface InvoiceActionsProps {
  /** Variante de visualización: dropdown (default) o buttons */
  variant?: "dropdown" | "buttons";
  invoiceId: string;
  invoiceSerie: string;
  invoiceFolio: number;
  invoiceStatus: InvoiceStatus;
  /**
   * Objeto Invoice completo — requerido en variant="buttons" para que
   * PaymentFormDialog pueda calcular el saldo pendiente.
   */
  fullInvoice?: Invoice;
  /** Callback para ver detalles (dropdown mode) */
  onView?: (id: string) => void;
  /** Callback para eliminar (dropdown mode — el padre confirma o delega aquí) */
  onDelete?: (id: string) => void;
  /** Callback tras acción exitosa en buttons mode */
  onActionComplete?: () => void;
  /**
   * Notifica cuando hay overlay o flujo de timbrado activo (pausar poll del detalle).
   */
  onBusyChange?: (busy: boolean) => void;
  /**
   * Incrementar desde el banner de atención fiscal (ADR-0093) para abrir
   * SubstituteInvoiceSheet cuando la acción está permitida.
   */
  openSubstituteRequestKey?: number;
}

export function InvoiceActions({
  variant = "dropdown",
  invoiceId,
  invoiceSerie,
  invoiceFolio,
  invoiceStatus,
  fullInvoice,
  onView,
  onDelete,
  onActionComplete,
  onBusyChange,
  openSubstituteRequestKey = 0,
}: InvoiceActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();

  // ── Dialog states ─────────────────────────────────────────────────────────

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [substituteSheetOpen, setSubstituteSheetOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const openSendDialogRef = useRef<() => void>(() => {});
  /** Snapshot frozen while payment/cancel/substitute overlays are open. */
  const [overlayInvoice, setOverlayInvoice] = useState<Invoice | null>(null);
  const lastBusyRef = useRef(false);
  const lastOpenSubstituteKeyRef = useRef(0);

  // ── Mutations (solo usadas en variant="buttons") ──────────────────────────

  const { mutate: deleteInvoice, isPending: deleting } = useDeleteInvoice({
    onSuccess: () => {
      toast({ title: "Borrador eliminado" });
      navigate("/finance/invoices");
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: getErrorMessage(err),
      }),
  });

  const { mutate: openPdf, isPending: openingPdf } = useOpenInvoicePdf({
    onError: (err) =>
      toast({
        variant: "destructive",
        title: actionsCopy.pdfError,
        description: getErrorMessage(err),
      }),
  });

  const { mutate: downloadXml, isPending: downloadingXml } =
    useDownloadInvoiceXml({
      onError: (err) =>
        toast({
          variant: "destructive",
          title: actionsCopy.xmlError,
          description: getErrorMessage(err),
        }),
    });

  // ── Permissions ───────────────────────────────────────────────────────────

  const canCreate = hasPermission("invoices", "create");
  const canUpdate = hasPermission("invoices", "update");
  const canDelete = hasPermission("invoices", "delete");
  const canExecute = hasPermission("invoices", "execute");
  // Lockstep with API: GET pdf/xml require invoices.read (no separate export).
  const canExport = hasPermission("invoices", "read");
  const canAdminManagerFiscal =
    role === ROLES.ADMIN || role === ROLES.MANAGER;

  const isDraft = invoiceStatus === "draft";
  const isStamped = invoiceStatus === "stamped";
  const isStampedLike =
    invoiceStatus === "stamped" || invoiceStatus === "cancellation_pending";

  const canShowRegisterPayment =
    Boolean(fullInvoice) &&
    canExecute &&
    canRegisterPayment(toInvoiceLike(fullInvoice!));

  const linkedTripId = fullInvoice?.trips[0]?.tripId;
  const isPrimaryFreightInvoice =
    parseInvoiceBillingScope(fullInvoice?.trips[0]?.billingScope) ===
    "primary_transport";
  const { data: linkedTrip } = useTrip(linkedTripId ?? "", {
    enabled: Boolean(isStamped && isPrimaryFreightInvoice && linkedTripId),
  });
  const hideSubstituteForFalseTrip =
    linkedTrip?.operationalOutcome === "false_trip";

  const tripNeedsFiscalAttention =
    Boolean(linkedTrip?.requiresFiscalAttention) && !hideSubstituteForFalseTrip;

  const canShowSubstitute =
    isStamped &&
    Boolean(fullInvoice?.canSubstituteInvoice) &&
    canExecute &&
    canAdminManagerFiscal &&
    !hideSubstituteForFalseTrip;

  const hasRegisteredCobros =
    Boolean(fullInvoice) &&
    ((fullInvoice!.totalPaid ?? 0) > 0 || (fullInvoice!.payments?.length ?? 0) > 0);

  const showBlockedSubstitute =
    isStamped &&
    canExecute &&
    canAdminManagerFiscal &&
    !hideSubstituteForFalseTrip &&
    Boolean(fullInvoice) &&
    !fullInvoice!.canSubstituteInvoice &&
    hasRegisteredCobros;

  /** Eleva Sustituir fuera de «Más» cuando el viaje pide continuidad fiscal. */
  const elevateSubstitutePrimary =
    variant === "buttons" &&
    tripNeedsFiscalAttention &&
    (canShowSubstitute || showBlockedSubstitute);

  const canShowCancel =
    isStamped && canExecute && canAdminManagerFiscal;

  const canShowExport = Boolean(fullInvoice) && isStampedLike && canExport;

  const canShowSendByEmail = isStamped && canExecute;

  const fiscal = useTripFiscalSheets({
    invoiceTripRefs: fullInvoice?.trips ?? [],
    enableAutoRestamp: variant === "buttons",
    onStampSuccess: onActionComplete,
    onStampSuccessToast:
      variant === "buttons" && canShowSendByEmail
        ? () => {
            toast({
              variant: "success",
              title: sendCopy.stampSuccessTitle,
              action: {
                label: sendCopy.stampSuccessAction,
                onClick: () => openSendDialogRef.current(),
              },
            });
          }
        : undefined,
    getStampErrorDescription: describeStampApiError,
  });

  openSendDialogRef.current = () => setSendDialogOpen(true);

  const isLoading =
    deleting || fiscal.isStampBusy || openingPdf || downloadingXml;

  const openOverlayWithSnapshot = (
    invoice: Invoice,
    kind: "payment" | "cancel" | "substitute",
  ) => {
    setOverlayInvoice(invoice);
    if (kind === "payment") setPaymentDialogOpen(true);
    if (kind === "cancel") setCancelDialogOpen(true);
    if (kind === "substitute") setSubstituteSheetOpen(true);
  };

  const handleOverlayOpenChange = (
    kind: "payment" | "cancel" | "substitute",
    open: boolean,
  ) => {
    if (kind === "payment") setPaymentDialogOpen(open);
    if (kind === "cancel") setCancelDialogOpen(open);
    if (kind === "substitute") setSubstituteSheetOpen(open);
    if (!open) {
      setOverlayInvoice(null);
      onActionComplete?.();
    }
  };

  useEffect(() => {
    if (variant !== "buttons" || !onBusyChange) return;
    const busy =
      paymentDialogOpen ||
      cancelDialogOpen ||
      substituteSheetOpen ||
      sendDialogOpen ||
      fiscal.isStampBusy;
    if (lastBusyRef.current === busy) return;
    lastBusyRef.current = busy;
    onBusyChange(busy);
  }, [
    variant,
    onBusyChange,
    paymentDialogOpen,
    cancelDialogOpen,
    substituteSheetOpen,
    sendDialogOpen,
    fiscal.isStampBusy,
  ]);

  useEffect(() => {
    if (variant !== "buttons") return;
    if (!openSubstituteRequestKey || openSubstituteRequestKey === lastOpenSubstituteKeyRef.current) {
      return;
    }
    lastOpenSubstituteKeyRef.current = openSubstituteRequestKey;
    if (canShowSubstitute && fullInvoice) {
      openOverlayWithSnapshot(fullInvoice, "substitute");
      return;
    }
    if (showBlockedSubstitute) {
      toast({
        variant: "destructive",
        title: actionsCopy.substituteBlockedTitle,
        description: actionsCopy.substituteBlocked,
      });
    }
  }, [
    variant,
    openSubstituteRequestKey,
    canShowSubstitute,
    showBlockedSubstitute,
    fullInvoice,
    toast,
  ]);

  const folioCombined = `${invoiceSerie}-${invoiceFolio}`;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: DROPDOWN MODE (para InvoiceTable / InvoiceCard)
  // ══════════════════════════════════════════════════════════════════════════

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menú de acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {onView && (
              <DropdownMenuItem onClick={() => onView(invoiceId)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
            )}

            {isDraft && canUpdate && (
              <DropdownMenuItem onClick={() => navigate(`/invoices/${invoiceId}/edit`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar borrador
              </DropdownMenuItem>
            )}

            {isDraft && canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (onDelete) {
                      onDelete(invoiceId);
                    } else {
                      setDeleteDialogOpen(true);
                    }
                  }}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {actionsCopy.deleteDraft}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete dialog (usado cuando no se pasa onDelete externo) */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este borrador?</AlertDialogTitle>
              <AlertDialogDescription>
                La factura <strong>{folioCombined}</strong> será eliminada
                permanentemente. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteInvoice(invoiceId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: BUTTONS MODE (para InvoiceDetailPage)
  // ══════════════════════════════════════════════════════════════════════════

  const primaryIsStamp = isDraft && canCreate && canExecute;
  const primaryIsPayment = canShowRegisterPayment && Boolean(fullInvoice);
  /** Con atención fiscal, Sustituir es la única primaria; pago pasa a secundaria. */
  const paymentIsSecondary = primaryIsPayment && elevateSubstitutePrimary;
  const paymentIsPrimary = primaryIsPayment && !elevateSubstitutePrimary;
  const hasDownloadMenu = canShowExport && Boolean(fullInvoice);
  const hasStampedXml =
    Boolean(fullInvoice) &&
    (fullInvoice!.hasStampedXml ?? Boolean(fullInvoice!.xmlContent));
  const hasTertiaryInMore =
    (isDraft && (canUpdate || canDelete)) ||
    (showBlockedSubstitute && !elevateSubstitutePrimary) ||
    (canShowSubstitute && Boolean(fullInvoice) && !elevateSubstitutePrimary) ||
    canShowCancel;
  /** Enviar / Descargar / pago secundario viven en «Más» bajo lg. */
  const hasResponsiveOverflow =
    canShowSendByEmail || hasDownloadMenu || paymentIsSecondary;
  const hasMoreMenu = hasTertiaryInMore || hasResponsiveOverflow;

  const hasToolbar =
    primaryIsStamp ||
    paymentIsPrimary ||
    elevateSubstitutePrimary ||
    hasMoreMenu;

  if (!hasToolbar) return null;

  const serieFolio = folioCombined;
  const moreHasMobileOverflow =
    paymentIsSecondary || canShowSendByEmail || hasDownloadMenu;
  const moreHasSubstituteItem =
    (showBlockedSubstitute ||
      (canShowSubstitute && Boolean(fullInvoice))) &&
    !elevateSubstitutePrimary;
  const moreHasEditDraft = isDraft && canUpdate;
  const moreHasItemsBeforeCancel =
    moreHasMobileOverflow || moreHasEditDraft || moreHasSubstituteItem;
  /** Separador solo visible bajo 2xl si lo único arriba es overflow compacto. */
  const cancelSeparatorClassName =
    moreHasMobileOverflow && !moreHasEditDraft && !moreHasSubstituteItem
      ? "2xl:hidden"
      : undefined;

  return (
    <>
      <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
        {primaryIsStamp ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => void fiscal.requestStamp(invoiceId)}
            disabled={isLoading}
          >
            {fiscal.isStampBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Stamp className="mr-2 h-4 w-4" />
            )}
            {fiscal.isStamping ? actionsCopy.stamping : actionsCopy.stamp}
          </Button>
        ) : null}

        {elevateSubstitutePrimary && showBlockedSubstitute ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="default"
                  size="sm"
                  disabled
                  aria-label={actionsCopy.substituteBlockedTitle}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {actionsCopy.substitute}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-left">
              {actionsCopy.substituteBlocked}
            </TooltipContent>
          </Tooltip>
        ) : null}

        {elevateSubstitutePrimary && canShowSubstitute && fullInvoice ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => openOverlayWithSnapshot(fullInvoice, "substitute")}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {actionsCopy.substitute}
          </Button>
        ) : null}

        {paymentIsPrimary && fullInvoice ? (
          <Button
            variant="default"
            size="sm"
            onClick={() => openOverlayWithSnapshot(fullInvoice, "payment")}
            disabled={isLoading}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            {actionsCopy.registerPayment}
          </Button>
        ) : null}

        {paymentIsSecondary && fullInvoice ? (
          <Button
            variant="outline"
            size="sm"
            className="hidden 2xl:inline-flex"
            onClick={() => openOverlayWithSnapshot(fullInvoice, "payment")}
            disabled={isLoading}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            {actionsCopy.registerPayment}
          </Button>
        ) : null}

        {canShowSendByEmail ? (
          <Button
            variant="outline"
            size="sm"
            className="hidden 2xl:inline-flex"
            onClick={() => setSendDialogOpen(true)}
            disabled={isLoading}
          >
            <Mail className="mr-2 h-4 w-4" />
            {actionsCopy.sendByEmail}
          </Button>
        ) : null}

        {hasDownloadMenu && fullInvoice ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-1 2xl:inline-flex"
                disabled={isLoading}
              >
                {openingPdf || downloadingXml ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {openingPdf
                  ? actionsCopy.downloadGenerating
                  : actionsCopy.downloadMenu}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                disabled={isLoading || openingPdf}
                onSelect={() =>
                  openPdf({
                    id: fullInvoice.id,
                    serieFolio,
                  })
                }
              >
                {openingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {invoicingCopy.detail.header.pdf}
              </DropdownMenuItem>
              {hasStampedXml ? (
                <DropdownMenuItem
                  disabled={isLoading || downloadingXml}
                  onSelect={() =>
                    downloadXml({
                      id: fullInvoice.id,
                      serieFolio,
                    })
                  }
                >
                  {downloadingXml ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileCode className="mr-2 h-4 w-4" />
                  )}
                  {invoicingCopy.detail.header.xml}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {hasMoreMenu ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={
                  hasTertiaryInMore
                    ? "gap-1"
                    : "gap-1 2xl:hidden"
                }
                disabled={isLoading}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>{actionsCopy.moreActions}</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
                <span className="sr-only">{actionsCopy.moreActionsSrOnly}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {paymentIsSecondary && fullInvoice ? (
                <DropdownMenuItem
                  className="2xl:hidden"
                  disabled={isLoading}
                  onSelect={() =>
                    openOverlayWithSnapshot(fullInvoice, "payment")
                  }
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  {actionsCopy.registerPayment}
                </DropdownMenuItem>
              ) : null}

              {canShowSendByEmail ? (
                <DropdownMenuItem
                  className="2xl:hidden"
                  disabled={isLoading}
                  onSelect={() => setSendDialogOpen(true)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {actionsCopy.sendByEmail}
                </DropdownMenuItem>
              ) : null}

              {hasDownloadMenu && fullInvoice ? (
                <>
                  <DropdownMenuItem
                    className="2xl:hidden"
                    disabled={isLoading || openingPdf}
                    onSelect={() =>
                      openPdf({
                        id: fullInvoice.id,
                        serieFolio,
                      })
                    }
                  >
                    {openingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {invoicingCopy.detail.header.pdf}
                  </DropdownMenuItem>
                  {hasStampedXml ? (
                    <DropdownMenuItem
                      className="2xl:hidden"
                      disabled={isLoading || downloadingXml}
                      onSelect={() =>
                        downloadXml({
                          id: fullInvoice.id,
                          serieFolio,
                        })
                      }
                    >
                      {downloadingXml ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileCode className="mr-2 h-4 w-4" />
                      )}
                      {invoicingCopy.detail.header.xml}
                    </DropdownMenuItem>
                  ) : null}
                </>
              ) : null}

              {moreHasEditDraft ? (
                <>
                  {moreHasMobileOverflow ? (
                    <DropdownMenuSeparator className="2xl:hidden" />
                  ) : null}
                  <DropdownMenuItem
                    onSelect={() => navigate(`/invoices/${invoiceId}/edit`)}
                    disabled={isLoading}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {actionsCopy.editDraft}
                  </DropdownMenuItem>
                </>
              ) : null}

              {showBlockedSubstitute && !elevateSubstitutePrimary ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block w-full">
                      <DropdownMenuItem
                        disabled
                        aria-label={actionsCopy.substituteBlockedTitle}
                        className="w-full"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {actionsCopy.substitute}
                      </DropdownMenuItem>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs text-left">
                    {actionsCopy.substituteBlocked}
                  </TooltipContent>
                </Tooltip>
              ) : null}

              {canShowSubstitute && fullInvoice && !elevateSubstitutePrimary ? (
                <DropdownMenuItem
                  disabled={isLoading}
                  onSelect={() => {
                    // Diferir apertura tras cerrar el menú (sheet-from-menu-focus).
                    setTimeout(
                      () => openOverlayWithSnapshot(fullInvoice, "substitute"),
                      0,
                    );
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {actionsCopy.substitute}
                </DropdownMenuItem>
              ) : null}

              {canShowCancel ? (
                <>
                  {moreHasItemsBeforeCancel ? (
                    <DropdownMenuSeparator
                      className={cancelSeparatorClassName}
                    />
                  ) : null}
                  <DropdownMenuItem
                    disabled={isLoading}
                    onSelect={() => {
                      if (fullInvoice) {
                        openOverlayWithSnapshot(fullInvoice, "cancel");
                      }
                    }}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {actionsCopy.cancel}
                  </DropdownMenuItem>
                </>
              ) : null}

              {isDraft && canDelete ? (
                <>
                  {moreHasEditDraft ||
                  moreHasSubstituteItem ||
                  canShowCancel ? (
                    <DropdownMenuSeparator />
                  ) : null}
                  <DropdownMenuItem
                    disabled={isLoading || deleting}
                    onSelect={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    {deleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {actionsCopy.deleteDraft}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              La factura <strong>{folioCombined}</strong> será eliminada
              permanentemente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInvoice(invoiceId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment dialog */}
      {overlayInvoice && paymentDialogOpen && (
        <PaymentFormDialog
          invoice={overlayInvoice}
          open={paymentDialogOpen}
          onOpenChange={(open) => handleOverlayOpenChange("payment", open)}
        />
      )}

      {/* Cancel dialog */}
      {overlayInvoice && cancelDialogOpen && (
        <CancelInvoiceDialog
          invoiceId={invoiceId}
          open={cancelDialogOpen}
          defaultCancellationCode={
            hideSubstituteForFalseTrip ? "03" : undefined
          }
          hasRegisteredPayments={hasRegisteredCobros}
          onOpenChange={(open) => handleOverlayOpenChange("cancel", open)}
        />
      )}

      {/* Substitute stamped invoice (SAT 01) */}
      {overlayInvoice && substituteSheetOpen && (
        <SubstituteInvoiceSheet
          invoice={overlayInvoice}
          open={substituteSheetOpen}
          onOpenChange={(open) => handleOverlayOpenChange("substitute", open)}
        />
      )}

      {variant === "buttons" && canShowSendByEmail ? (
        <SendInvoiceDialog
          invoiceId={invoiceId}
          open={sendDialogOpen}
          onOpenChange={setSendDialogOpen}
          alreadySent={Boolean(fullInvoice?.dispatchSentAt)}
          onSent={onActionComplete}
        />
      ) : null}

      {fiscal.sheets}
    </>
  );
}

export default InvoiceActions;
