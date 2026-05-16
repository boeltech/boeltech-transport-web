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
} from "lucide-react";
import {
  useDeleteInvoice,
  useStampInvoice,
} from "@features/invoicing/application";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { SubstituteInvoiceDialog } from "./SubstituteInvoiceDialog";
import type { InvoiceStatus, Invoice } from "@features/invoicing/domain";

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
  if (!isApiError(error) || error.code !== "CP31_INVALID_NUMERIC_DATA") {
    return getErrorMessage(error);
  }
  const rawDetails = error.details;
  const details = Array.isArray(rawDetails) ? (rawDetails as Cp31NumericDetail[]) : [];
  const invalids = details
    .filter((d) => d.code === "CP31_INVALID_NUMERIC_DATA" && typeof d.path === "string")
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
  const [substituteDialogOpen, setSubstituteDialogOpen] = useState(false);
  const [stampErrorDialog, setStampErrorDialog] = useState<{
    open: boolean;
    description: string;
  }>({ open: false, description: "" });

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

  const handleStampError = (err: unknown) => {
    const description = getStampErrorDescription(err);
    toast({
      variant: "destructive",
      title: "Error al timbrar",
      description,
    });

    const shouldOpenDialog =
      (isApiError(err) && err.code === "CP31_INVALID_NUMERIC_DATA") ||
      description.includes("\n") ||
      description.length > 180;
    if (shouldOpenDialog) {
      setStampErrorDialog({ open: true, description });
    }
  };

  const { mutate: stamp, isPending: stamping } = useStampInvoice({
    onSuccess: () => {
      toast({ title: "Factura timbrada exitosamente" });
      onActionComplete?.();
    },
    onError: handleStampError,
  });

  const isLoading = deleting || stamping;

  // ── Permissions ───────────────────────────────────────────────────────────

  const canCreate = hasPermission("invoices", "create");
  const canUpdate = hasPermission("invoices", "update");
  const canDelete = hasPermission("invoices", "delete");

  const isDraft = invoiceStatus === "draft";
  const isStamped = invoiceStatus === "stamped";
  const hasPendingBalance = (fullInvoice?.balanceDue ?? 0) > 0;

  const canShowSubstitute =
    isStamped &&
    Boolean(fullInvoice?.canSubstituteInvoice) &&
    hasPermission("invoices", "delete");

  const hasStampedActions =
    isStamped &&
    ((canCreate && hasPendingBalance) || canDelete || canShowSubstitute);

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
                  Eliminar borrador
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
    (!isStamped || !hasStampedActions);

  if (hasNoActions) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Eliminar borrador */}
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
            Eliminar borrador
          </Button>
        )}

        {/* Timbrar */}
        {isDraft && canCreate && (
          <Button
            variant="default"
            size="sm"
            onClick={() => stamp(invoiceId)}
            disabled={isLoading}
          >
            {stamping ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Stamp className="mr-2 h-4 w-4" />
            )}
            {stamping ? "Timbrando..." : "Timbrar"}
          </Button>
        )}

        {/* Editar borrador */}
        {isDraft && canUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/invoices/${invoiceId}/edit`)}
            disabled={isLoading}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}

        {/* Registrar pago */}
        {isStamped && canCreate && hasPendingBalance && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaymentDialogOpen(true)}
            disabled={isLoading}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Registrar pago
          </Button>
        )}

        {/* Sustituir (Fase 5) */}
        {canShowSubstitute && fullInvoice && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSubstituteDialogOpen(true)}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sustituir factura
          </Button>
        )}

        {/* Cancelar */}
        {isStamped && canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setCancelDialogOpen(true)}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        )}
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

      {/* Stamp error details */}
      <AlertDialog
        open={stampErrorDialog.open}
        onOpenChange={(open) =>
          setStampErrorDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error al timbrar factura</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-left">
              {stampErrorDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() =>
                setStampErrorDialog({ open: false, description: "" })
              }
            >
              Entendido
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
      {fullInvoice && (
        <SubstituteInvoiceDialog
          invoice={fullInvoice}
          open={substituteDialogOpen}
          onOpenChange={(open) => {
            setSubstituteDialogOpen(open);
            if (!open) onActionComplete?.();
          }}
        />
      )}
    </>
  );
}

export default InvoiceActions;
