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
import { isClientPortalRole, ROLES } from "@shared/constants/roles";
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
} from "lucide-react";
import { canRegisterPayment } from "@boeltech/cfdi-domain";
import { useDeleteInvoice, useOpenInvoicePdf, downloadInvoiceXml } from "@features/invoicing/application";
import { parseInvoiceBillingScope, toInvoiceLike } from "@features/invoicing/domain";
import { useTrip } from "@features/trips/application";
import {
  describeStampApiError,
  useTripFiscalSheets,
} from "@features/trips/presentation/components/trip-fiscal";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { SubstituteInvoiceSheet } from "./SubstituteInvoiceSheet";
import type { InvoiceStatus, Invoice } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

const actionsCopy = invoicingCopy.detail.actions;

const cancelButtonClassName =
  "border-destructive/40 text-destructive hover:bg-destructive-soft hover:text-destructive-soft-foreground";

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
}: InvoiceActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const isClientPortal = isClientPortalRole(role);

  // ── Dialog states ─────────────────────────────────────────────────────────

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [substituteSheetOpen, setSubstituteSheetOpen] = useState(false);
  /** Snapshot frozen while payment/cancel/substitute overlays are open. */
  const [overlayInvoice, setOverlayInvoice] = useState<Invoice | null>(null);
  const lastBusyRef = useRef(false);

  // ── Mutations (solo usadas en variant="buttons") ──────────────────────────

  const { mutate: deleteInvoice, isPending: deleting } = useDeleteInvoice({
    onSuccess: () => {
      toast({ title: "Borrador eliminado" });
      navigate("/finance?tab=invoices");
    },
    onError: (err) =>
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: getErrorMessage(err),
      }),
  });

  const fiscal = useTripFiscalSheets({
    invoiceTripRefs: fullInvoice?.trips ?? [],
    enableAutoRestamp: variant === "buttons",
    onStampSuccess: onActionComplete,
    getStampErrorDescription: describeStampApiError,
  });

  const { mutate: openPdf, isPending: openingPdf } = useOpenInvoicePdf({
    onError: (err) =>
      toast({
        variant: "destructive",
        title: actionsCopy.pdfError,
        description: getErrorMessage(err),
      }),
  });

  const isLoading =
    deleting || fiscal.isStampBusy || openingPdf;

  // ── Permissions ───────────────────────────────────────────────────────────

  const canCreate = hasPermission("invoices", "create");
  const canUpdate = hasPermission("invoices", "update");
  const canDelete = hasPermission("invoices", "delete");
  const canExecute = hasPermission("invoices", "execute");
  const canExport =
    hasPermission("invoices", "export") ||
    (isClientPortal && hasPermission("invoices", "read"));
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

  const canShowCancel =
    isStamped && canExecute && canAdminManagerFiscal;

  const canShowExport = Boolean(fullInvoice) && isStampedLike && canExport;

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
    fiscal.isStampBusy,
  ]);

  const hasStampedActions =
    isStamped &&
    (canShowRegisterPayment ||
      canShowCancel ||
      canShowSubstitute ||
      showBlockedSubstitute);

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

  const hasNoActions =
    (!isDraft || (!canDelete && !canCreate && !canUpdate)) &&
    (!isStamped || !hasStampedActions) &&
    !canShowExport;

  if (hasNoActions) return null;

  const serieFolio = folioCombined;

  const hasWorkflowActions =
    (isDraft && (canDelete || canCreate || canUpdate)) ||
    canShowRegisterPayment ||
    canShowSubstitute ||
    showBlockedSubstitute;

  const hasSecondaryActions =
    canShowExport || canShowCancel;

  const primaryIsStamp = isDraft && canCreate && canExecute;
  const primaryIsPayment = canShowRegisterPayment && Boolean(fullInvoice);

  return (
    <>
      <div className="flex flex-col gap-2 sm:items-end">
        {/* D5: CTA primaria única según estado */}
        {(primaryIsStamp || primaryIsPayment) && (
          <div className="flex flex-wrap items-center justify-end gap-2">
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

            {primaryIsPayment && fullInvoice ? (
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
          </div>
        )}

        {hasWorkflowActions || hasSecondaryActions ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isDraft && canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/invoices/${invoiceId}/edit`)}
                disabled={isLoading}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {actionsCopy.editDraft}
              </Button>
            )}

            {canShowExport && fullInvoice ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    openPdf({
                      id: fullInvoice.id,
                      serieFolio,
                    })
                  }
                  disabled={isLoading}
                  title={invoicingCopy.detail.header.pdfTitle}
                >
                  {openingPdf ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {openingPdf
                    ? invoicingCopy.detail.header.pdfGenerating
                    : invoicingCopy.detail.header.pdf}
                </Button>
                {(fullInvoice.hasStampedXml ??
                  Boolean(fullInvoice.xmlContent)) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadInvoiceXml(fullInvoice.id, serieFolio)
                    }
                    disabled={isLoading}
                    title={invoicingCopy.detail.header.xmlTitle}
                  >
                    <FileCode className="mr-2 h-4 w-4" />
                    {invoicingCopy.detail.header.xml}
                  </Button>
                ) : null}
              </>
            ) : null}

            {showBlockedSubstitute ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex">
                    <Button
                      variant="outline"
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

            {canShowSubstitute && fullInvoice ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openOverlayWithSnapshot(fullInvoice, "substitute")
                }
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {actionsCopy.substitute}
              </Button>
            ) : null}

            {isDraft && canDelete ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isLoading}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {actionsCopy.deleteDraft}
              </Button>
            ) : null}

            {canShowCancel ? (
              <Button
                variant="outline"
                size="sm"
                className={cancelButtonClassName}
                onClick={() => {
                  if (fullInvoice) {
                    openOverlayWithSnapshot(fullInvoice, "cancel");
                  }
                }}
                disabled={isLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {actionsCopy.cancel}
              </Button>
            ) : null}
          </div>
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

      {fiscal.sheets}
    </>
  );
}

export default InvoiceActions;
