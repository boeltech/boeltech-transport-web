/**
 * TripActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Menú de acciones para un viaje individual.
 * Soporta dos modos de uso:
 *
 * 1. Con objeto trip (para TripTable):
 *    <TripActions trip={trip} onView={...} onEdit={...} />
 *
 * 2. Con props individuales (para TripDetailPage):
 *    <TripActions tripId={id} tripCode={code} status={status} variant="detailMenu" />
 *
 * Ubicación: src/features/trips/presentation/components/TripActions.tsx
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import { AlertWithIcon } from "@shared/ui/alert";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  useCancelTrip,
  useDeleteTrip,
} from "../../application";
import {
  TripStatus,
  type TripListItem,
  type Trip,
  type TripStatusType,
} from "../../domain";
import { tripsListCopy } from "../copy/listCopy";
import { tripDetailCopy } from "../copy";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  XCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props cuando se pasa el objeto trip completo (usado en TripTable)
 */
interface TripObjectProps {
  trip: TripListItem | Trip;
  tripId?: never;
  tripCode?: never;
  status?: never;
}

/**
 * Props cuando se pasan valores individuales (usado en TripDetailPage)
 */
interface TripIndividualProps {
  trip?: never;
  tripId: string;
  tripCode: string;
  status: TripStatusType;
}

/**
 * Props comunes
 */
interface CommonProps {
  /** Variante de visualización: dropdown (tabla), buttons (legacy), detailMenu (detalle con disparador «Más»). */
  variant?: "dropdown" | "buttons" | "detailMenu";
  /** PD3: aviso en Cancelar si hay llegada y no hay carga entregada. */
  hasRealArrival?: boolean;
  hasDeliveredCargo?: boolean;
  /** Callback para ver detalles (solo en modo dropdown desde tabla) */
  onView?: (id: string) => void;
  /** Callback para editar (solo en modo dropdown desde tabla) */
  onEdit?: (id: string) => void;
  /** Callback para eliminar (solo en modo dropdown desde tabla) */
  onDelete?: (id: string) => void;
  /** Callback para programar (solo en modo dropdown desde tabla) */
  onSchedule?: (id: string) => void;
  /** Callback para cancelar (solo en modo dropdown desde tabla) */
  onCancel?: (id: string) => void;
  /** Callback después de una acción exitosa; recibe el viaje actualizado cuando aplique. */
  onActionComplete?: (trip?: Trip) => void;
}

type TripActionsProps = CommonProps & (TripObjectProps | TripIndividualProps);

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_TRANSITIONS: Record<TripStatusType, string[]> = {
  [TripStatus.DRAFT]: ["schedule", "cancel", "delete"],
  [TripStatus.SCHEDULED]: ["cancel"],
  [TripStatus.IN_PROGRESS]: ["cancel"],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};

const EDITABLE_STATUSES: TripStatusType[] = [
  TripStatus.DRAFT,
  TripStatus.SCHEDULED,
];

// ============================================================================
// COMPONENT
// ============================================================================

export function TripActions(props: TripActionsProps) {
  const {
    variant = "dropdown",
    onView,
    onEdit,
    onDelete,
    onCancel,
    onActionComplete,
    hasRealArrival = false,
    hasDeliveredCargo = false,
  } = props;

  // Extraer valores del trip o de props individuales
  const id = props.trip?.id ?? props.tripId!;
  const code = props.trip?.tripCode ?? props.tripCode!;
  const currentStatus = props.trip?.status ?? props.status!;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // ---------------------------------------------------------------------------
  // DIALOG STATES (variant "buttons" y "detailMenu")
  // ---------------------------------------------------------------------------

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "delete" | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: "",
    description: "",
  });

  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    reason: string;
  }>({
    open: false,
    reason: "",
  });

  // ---------------------------------------------------------------------------
  // MUTATIONS (variant "buttons" y "detailMenu")
  // ---------------------------------------------------------------------------

  const cancelMutation = useCancelTrip({
    onSuccess: (trip) => {
      toast({
        title: "Viaje cancelado",
        description: code,
        variant: "success",
      });
      onActionComplete?.(trip);
    },
    onError: (error) => {
      toast({
        title: "Error al cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useDeleteTrip({
    onSuccess: () => {
      toast({ title: "Viaje eliminado", variant: "success" });
      navigate("/trips");
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading =
    cancelMutation.isPending ||
    deleteMutation.isPending;

  // ---------------------------------------------------------------------------
  // PERMISSIONS & AVAILABLE ACTIONS
  // ---------------------------------------------------------------------------

  const canUpdate = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  const validTransitions = VALID_TRANSITIONS[currentStatus] || [];

  const canCancelTrip = validTransitions.includes("cancel") && canUpdate;
  const showFalseTripCancelHint =
    canCancelTrip &&
    currentStatus === TripStatus.IN_PROGRESS &&
    hasRealArrival &&
    !hasDeliveredCargo;
  const canEditTrip = EDITABLE_STATUSES.includes(currentStatus) && canUpdate;
  const canDeleteTrip = validTransitions.includes("delete") && canDelete;

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleConfirm = () => {
    if (confirmDialog.action === "delete") {
      deleteMutation.mutate(id);
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleCancelConfirm = () => {
    cancelMutation.mutate({
      id,
      reason: cancelDialog.reason || undefined,
    });
    setCancelDialog({ open: false, reason: "" });
  };

  const hasNoActions =
    !canCancelTrip && !canEditTrip && !canDeleteTrip;

  const tripActionDialogs = (
    <>
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <SectionHeadingWithHint
                noTitleWrap
                title={<span>{confirmDialog.title}</span>}
                hintLabel={confirmDialog.title}
                hint={confirmDialog.description}
              />
            </AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmDialog.action === "delete"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <SectionHeadingWithHint
                title="Cancelar viaje"
                titleClassName="text-lg font-semibold leading-none tracking-tight"
                hintLabel="Cancelar viaje"
                hint={<>El viaje {code} será cancelado. Esta acción no se puede deshacer.</>}
              />
            </DialogTitle>
            <DialogDescription className="sr-only">
              Cancelación permanente del viaje.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {showFalseTripCancelHint ? (
              <AlertWithIcon
                variant="warning"
                title={tripsListCopy.dialog.falseTripInsteadTitle}
              >
                <p>{tripsListCopy.dialog.falseTripInsteadBody}</p>
                <Link
                  to={`/trips/${id}?tab=tracking`}
                  className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                  onClick={() => setCancelDialog({ open: false, reason: "" })}
                >
                  {tripsListCopy.dialog.falseTripInsteadCta}
                </Link>
              </AlertWithIcon>
            ) : null}
            <div>
            <Label htmlFor="cancel-reason">
              Motivo de cancelación (opcional)
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Ingrese el motivo de la cancelación..."
              value={cancelDialog.reason}
              onChange={(e) =>
                setCancelDialog({ ...cancelDialog, reason: e.target.value })
              }
              className="mt-2"
            />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog({ open: false, reason: "" })}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar viaje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // ---------------------------------------------------------------------------
  // RENDER: DROPDOWN MODE (para TripTable)
  // ---------------------------------------------------------------------------

  if (variant === "dropdown") {
    const hasMutationMenuItems =
      (canEditTrip && Boolean(onEdit)) ||
      (canCancelTrip && Boolean(onCancel)) ||
      (canDeleteTrip && Boolean(onDelete));

    // Read-only (p. ej. portal client): la fila ya navega al detalle; sin ⋯ vacío.
    if (!hasMutationMenuItems) {
      return null;
    }

    const hasStateActions = Boolean(canCancelTrip && onCancel);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú de acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onView && (
            <DropdownMenuItem onClick={() => onView(id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
          )}

          {canEditTrip && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {hasStateActions && (
            <>
              <DropdownMenuSeparator />

              {canCancelTrip && onCancel && (
                <DropdownMenuItem
                  onClick={() => onCancel(id)}
                  className="text-warning focus:text-warning"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar viaje
                </DropdownMenuItem>
              )}
            </>
          )}

          {canDeleteTrip && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: DETAIL HEADER MENU (Facturación + Más en detalle de viaje)
  // ---------------------------------------------------------------------------

  if (variant === "detailMenu") {
    const hasMenuContent = canCancelTrip || canDeleteTrip;
    if (!hasMenuContent) {
      return null;
    }

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 shrink-0" disabled={isLoading}>
              <MoreHorizontal className="h-4 w-4 shrink-0" />
              <span className="mx-0.5">{tripDetailCopy.shell.action.more}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {canCancelTrip ? (
              <DropdownMenuItem
                onSelect={() => setCancelDialog({ open: true, reason: "" })}
                disabled={isLoading}
                className="text-warning focus:text-warning"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar viaje
              </DropdownMenuItem>
            ) : null}

            {canDeleteTrip ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    setConfirmDialog({
                      open: true,
                      action: "delete",
                      title: "¿Eliminar este viaje?",
                      description:
                        "Esta acción no se puede deshacer. El viaje será eliminado permanentemente.",
                    })
                  }
                  disabled={isLoading}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        {tripActionDialogs}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER: BUTTONS MODE (legacy / otras pantallas)
  // ---------------------------------------------------------------------------

  if (hasNoActions) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Editar */}
        {canEditTrip && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/trips/${id}/edit`)}
            disabled={isLoading}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}

        {/* Cancelar viaje */}
        {canCancelTrip && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCancelDialog({ open: true, reason: "" })}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar viaje
          </Button>
        )}

        {/* Eliminar */}
        {canDeleteTrip && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              setConfirmDialog({
                open: true,
                action: "delete",
                title: "¿Eliminar este viaje?",
                description:
                  "Esta acción no se puede deshacer. El viaje será eliminado permanentemente.",
              })
            }
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        )}
      </div>
      {tripActionDialogs}
    </>
  );
}

export default TripActions;
