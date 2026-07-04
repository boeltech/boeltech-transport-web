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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
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
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage, isApiError } from "@shared/api/interceptors/error-handler";
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
import { toInvoiceLike } from "@features/invoicing/domain";
import { useTripFiscalSheets } from "@features/trips/presentation/components/trip-fiscal";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { SubstituteInvoiceSheet } from "./SubstituteInvoiceSheet";
import type { InvoiceStatus, Invoice } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

const actionsCopy = invoicingCopy.detail.actions;

function InvoiceActionSeparator() {
  return (
    <span
      className="hidden h-6 w-px shrink-0 self-center bg-border sm:block"
      aria-hidden
    />
  );
}

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
}

type Cp31NumericDetail = {
  code?: string;
  path?: string;
  message?: string;
};

function formatCp31Path(path: string): string {
  const tripStop = /^trip\.([^.\s]+)\.stop\.(\d+)\.distance_from_previous_km$/.exec(path);
  if (tripStop) {
    return `Viaje ${tripStop[1]} · parada ${tripStop[2]}: distancia previa`;
  }
  const tripTotal = /^trip\.([^.\s]+)\.total_dist_rec$/.exec(path);
  if (tripTotal) {
    return `Viaje ${tripTotal[1]}: distancia total`;
  }
  const tripDistance = /^trip\.([^.\s]+)\.distancia_recorrida$/.exec(path);
  if (tripDistance) {
    return `Viaje ${tripDistance[1]}: distancia recorrida`;
  }
  const cargoWeight = /^cargo\.(\d+)\.weight_in_kg$/.exec(path);
  if (cargoWeight) {
    return `Carga ${Number(cargoWeight[1]) + 1}: peso (kg)`;
  }
  const cargoUnits = /^cargo\.(\d+)\.units$/.exec(path);
  if (cargoUnits) {
    return `Carga ${Number(cargoUnits[1]) + 1}: unidades`;
  }
  return path.replaceAll(".", " > ");
}

function getStampErrorDescription(error: unknown): string {
  if (!isApiError(error)) {
    return getErrorMessage(error);
  }

  if (error.code === "CP31_INVALID_NUMERIC_DATA") {
    const rawDetails = error.details;
    const details = Array.isArray(rawDetails)
      ? (rawDetails as Cp31NumericDetail[])
      : [];
    const invalids = details
      .filter(
        (d) => d.code === "CP31_INVALID_NUMERIC_DATA" && typeof d.path === "string",
      )
      .map((d) => `• ${formatCp31Path(d.path!)}`);
    if (invalids.length === 0) {
      return error.message;
    }
    const preview = invalids.slice(0, 4);
    const more = invalids.length - preview.length;
    return [
      "Se detectaron valores numéricos inválidos en Carta Porte:",
      ...preview,
      ...(more > 0 ? [`• ...y ${more} campo(s) más`] : []),
    ].join("\n");
  }

  const detailMessages = error.validationErrors
    .map((entry) => entry.message.trim())
    .filter((message) => message.length > 0);

  if (detailMessages.length === 1) {
    return detailMessages[0];
  }

  if (detailMessages.length > 1) {
    const preview = detailMessages.slice(0, 4).map((message) => `• ${message}`);
    const more = detailMessages.length - preview.length;
    return [
      error.message,
      ...preview,
      ...(more > 0 ? [`• ...y ${more} problema(s) más`] : []),
    ].join("\n");
  }

  return error.message || getErrorMessage(error);
}

// ============================================================================
// COMPONENT
// ============================================================================

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
}: InvoiceActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // ── Dialog states ─────────────────────────────────────────────────────────

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [substituteSheetOpen, setSubstituteSheetOpen] = useState(false);

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
    getStampErrorDescription,
  });

  const { mutate: openPdf, isPending: openingPdf } = useOpenInvoicePdf({
    onError: (err) =>
      toast({
        variant: "destructive",
        title: actionsCopy.pdfError,
        description: getErrorMessage(err),
      }),
  });

  const isLoading = deleting || fiscal.isStamping || openingPdf;

  // ── Permissions ───────────────────────────────────────────────────────────

  const canCreate = hasPermission("invoices", "create");
  const canUpdate = hasPermission("invoices", "update");
  const canDelete = hasPermission("invoices", "delete");
  const canExecute = hasPermission("invoices", "execute");
  const canExport = hasPermission("invoices", "export");

  const isDraft = invoiceStatus === "draft";
  const isStamped = invoiceStatus === "stamped";
  const isStampedLike =
    invoiceStatus === "stamped" || invoiceStatus === "cancellation_pending";

  const canShowRegisterPayment =
    Boolean(fullInvoice) &&
    canCreate &&
    canRegisterPayment(toInvoiceLike(fullInvoice!));

  const canShowSubstitute =
    isStamped &&
    Boolean(fullInvoice?.canSubstituteInvoice) &&
    canExecute;

  const canShowCancel = isStamped && canExecute;

  const canShowExport = Boolean(fullInvoice) && isStampedLike && canExport;

  const hasStampedActions =
    isStamped &&
    (canShowRegisterPayment || canShowCancel || canShowSubstitute);

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
    canShowSubstitute;

  const hasSecondaryActions =
    canShowExport || canShowCancel;

  return (
    <>
      <div className="flex flex-col gap-2 sm:items-end">
        {hasWorkflowActions ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isDraft && canDelete && (
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
            )}

            {isDraft && canCreate && (
              <Button
                variant="default"
                size="sm"
                onClick={() => void fiscal.requestStamp(invoiceId)}
                disabled={isLoading}
              >
                {fiscal.isStamping ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Stamp className="mr-2 h-4 w-4" />
                )}
                {fiscal.isStamping ? actionsCopy.stamping : actionsCopy.stamp}
              </Button>
            )}

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

            {canShowRegisterPayment && fullInvoice && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setPaymentDialogOpen(true)}
                disabled={isLoading}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                {actionsCopy.registerPayment}
              </Button>
            )}

            {canShowSubstitute && fullInvoice && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubstituteSheetOpen(true)}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {actionsCopy.substitute}
              </Button>
            )}
          </div>
        ) : null}

        {hasSecondaryActions ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
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

            {canShowExport && canShowCancel ? <InvoiceActionSeparator /> : null}

            {canShowCancel ? (
              <Button
                variant="outline"
                size="sm"
                className={cancelButtonClassName}
                onClick={() => setCancelDialogOpen(true)}
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
      {fullInvoice && paymentDialogOpen && (
        <PaymentFormDialog
          invoice={fullInvoice}
          open={paymentDialogOpen}
          onOpenChange={(open) => {
            setPaymentDialogOpen(open);
            if (!open) onActionComplete?.();
          }}
        />
      )}

      {/* Cancel dialog */}
      {cancelDialogOpen && (
        <CancelInvoiceDialog
          invoiceId={invoiceId}
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            setCancelDialogOpen(open);
            if (!open) onActionComplete?.();
          }}
        />
      )}

      {/* Substitute stamped invoice (SAT 01) */}
      {fullInvoice && substituteSheetOpen && (
        <SubstituteInvoiceSheet
          invoice={fullInvoice}
          open={substituteSheetOpen}
          onOpenChange={(open) => {
            setSubstituteSheetOpen(open);
            if (!open) onActionComplete?.();
          }}
        />
      )}

      {fiscal.sheets}
    </>
  );
}

export default InvoiceActions;
