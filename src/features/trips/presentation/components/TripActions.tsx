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
 *    <TripActions tripId={id} tripCode={code} status={status} variant="detailMenu" onQuickEdit={...} />
 *
 * Ubicación: src/features/trips/presentation/components/TripActions.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  useScheduleTrip,
  useCancelTrip,
  useDeleteTrip,
} from "../../application";
import { StartTripDialog } from "./StartTripDialog";
import {
  TripStatus,
  type TripListItem,
  type Trip,
  type TripStatusType,
} from "../../domain";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
  Loader2,
  ChevronDown,
  Truck,
  Edit3,
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
  vehicleId?: string;
  tripStartMileage?: number | null;
}

/**
 * Props comunes
 */
interface CommonProps {
  /** Variante de visualización: dropdown (tabla), buttons (legacy), detailMenu (detalle con disparador «Operación»). */
  variant?: "dropdown" | "buttons" | "detailMenu";
  /** En `detailMenu`: abre edición rápida (Sheet) desde el menú Operación. */
  onQuickEdit?: () => void;
  /** Callback para ver detalles (solo en modo dropdown desde tabla) */
  onView?: (id: string) => void;
  /** Callback para editar (solo en modo dropdown desde tabla) */
  onEdit?: (id: string) => void;
  /** Callback para eliminar (solo en modo dropdown desde tabla) */
  onDelete?: (id: string) => void;
  /** Callback para programar (solo en modo dropdown desde tabla) */
  onSchedule?: (id: string) => void;
  /** Callback para iniciar (solo en modo dropdown desde tabla) */
  onStart?: (id: string) => void;
  /** Callback para finalizar (solo en modo dropdown desde tabla) */
  onFinish?: (id: string) => void;
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
  [TripStatus.SCHEDULED]: ["start", "cancel"],
  [TripStatus.IN_PROGRESS]: ["finish", "cancel"],
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
    onQuickEdit,
    onView,
    onEdit,
    onDelete,
    onSchedule,
    onStart,
    onFinish,
    onCancel,
    onActionComplete,
  } = props;

  // Extraer valores del trip o de props individuales
  const id = props.trip?.id ?? props.tripId!;
  const code = props.trip?.tripCode ?? props.tripCode!;
  const currentStatus = props.trip?.status ?? props.status!;
  const vehicleId =
    props.trip && "vehicleId" in props.trip
      ? props.trip.vehicleId
      : props.trip
        ? props.trip.vehicle.id
        : props.vehicleId;
  const tripStartMileage =
    props.trip && "mileage" in props.trip
      ? props.trip.mileage.start
      : "tripStartMileage" in props
        ? (props.tripStartMileage ?? null)
        : null;

  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // ---------------------------------------------------------------------------
  // DIALOG STATES (variant "buttons" y "detailMenu")
  // ---------------------------------------------------------------------------

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "schedule" | "delete" | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: "",
    description: "",
  });

  const [startDialogOpen, setStartDialogOpen] = useState(false);

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

  const scheduleMutation = useScheduleTrip({
    onSuccess: (trip) => {
      toast({
        title: "Viaje programado",
        description: `${code} está listo para iniciar`,
        variant: "success",
      });
      onActionComplete?.(trip);
    },
    onError: (error) => {
      toast({
        title: "Error al programar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    scheduleMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending;

  // ---------------------------------------------------------------------------
  // PERMISSIONS & AVAILABLE ACTIONS
  // ---------------------------------------------------------------------------

  const canUpdate = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  const validTransitions = VALID_TRANSITIONS[currentStatus] || [];

  const canSchedule = validTransitions.includes("schedule") && canUpdate;
  const canStart = validTransitions.includes("start") && canUpdate;
  const canFinish = validTransitions.includes("finish") && canUpdate;
  const canCancelTrip = validTransitions.includes("cancel") && canUpdate;
  const canEditTrip = EDITABLE_STATUSES.includes(currentStatus) && canUpdate;
  const canDeleteTrip = validTransitions.includes("delete") && canDelete;

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleConfirm = () => {
    switch (confirmDialog.action) {
      case "schedule":
        scheduleMutation.mutate(id);
        break;
      case "delete":
        deleteMutation.mutate(id);
        break;
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
    !canSchedule &&
    !canStart &&
    !canFinish &&
    !canCancelTrip &&
    !canEditTrip &&
    !canDeleteTrip;

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

      <StartTripDialog
        tripId={id}
        tripCode={code}
        vehicleId={vehicleId}
        tripStartMileage={tripStartMileage}
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onSuccess={onActionComplete}
      />

      <Dialog
        open={cancelDialog.open}
        onOpenChange={(open) => setCancelDialog({ ...cancelDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <SectionHeadingWithHint
                title="Cancelar Viaje"
                titleClassName="text-lg font-semibold leading-none tracking-tight"
                hintLabel="Cancelar viaje"
                hint={<>El viaje {code} será cancelado. Esta acción no se puede deshacer.</>}
              />
            </DialogTitle>
            <DialogDescription className="sr-only">
              Cancelación permanente del viaje.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
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
              Cancelar Viaje
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
    const hasStateActions =
      (canSchedule && onSchedule) ||
      (canStart && onStart) ||
      (canFinish && onFinish) ||
      (canCancelTrip && onCancel);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú de acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Ver detalles */}
          {onView && (
            <DropdownMenuItem onClick={() => onView(id)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
          )}

          {/* Editar */}
          {canEditTrip && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {/* Acciones de estado */}
          {hasStateActions && (
            <>
              <DropdownMenuSeparator />

              {canSchedule && onSchedule && (
                <DropdownMenuItem onClick={() => onSchedule(id)}>
                  <Calendar className="mr-2 h-4 w-4 text-info" />
                  Programar
                </DropdownMenuItem>
              )}

              {canStart && onStart && (
                <DropdownMenuItem onClick={() => onStart(id)}>
                  <Play className="mr-2 h-4 w-4 text-success" />
                  Iniciar viaje
                </DropdownMenuItem>
              )}

              {canFinish && onFinish && (
                <DropdownMenuItem onClick={() => onFinish(id)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-success" />
                  Finalizar viaje
                </DropdownMenuItem>
              )}

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

          {/* Eliminar */}
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
  // RENDER: DETAIL HEADER MENU (Facturación + Operación en detalle de viaje)
  // ---------------------------------------------------------------------------

  if (variant === "detailMenu") {
    const hasMenuContent = Boolean(onQuickEdit) || !hasNoActions;
    if (!hasMenuContent) {
      return null;
    }

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 shrink-0" disabled={isLoading}>
              <Truck className="h-4 w-4 shrink-0" />
              <span className="mx-0.5">Operación</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {onQuickEdit ? (
              <DropdownMenuItem onSelect={() => onQuickEdit()}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edición rápida
              </DropdownMenuItem>
            ) : null}

            {canEditTrip ? (
              <DropdownMenuItem
                onSelect={() => navigate(`/trips/${id}/edit`)}
                disabled={isLoading}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edición completa
              </DropdownMenuItem>
            ) : null}

            {(onQuickEdit || canEditTrip) &&
            (canSchedule || canStart || canFinish || canCancelTrip || canDeleteTrip) ? (
              <DropdownMenuSeparator />
            ) : null}

            {canSchedule ? (
              <DropdownMenuItem
                onSelect={() =>
                  setConfirmDialog({
                    open: true,
                    action: "schedule",
                    title: "¿Programar este viaje?",
                    description:
                      "El viaje pasará a estado 'Programado' y estará listo para iniciarse.",
                  })
                }
                disabled={isLoading}
              >
                <Calendar className="mr-2 h-4 w-4 text-info" />
                Programar
              </DropdownMenuItem>
            ) : null}

            {canStart ? (
              <DropdownMenuItem
                onSelect={() => setStartDialogOpen(true)}
                disabled={isLoading}
              >
                <Play className="mr-2 h-4 w-4 text-success" />
                Iniciar viaje
              </DropdownMenuItem>
            ) : null}

            {canFinish ? (
              <DropdownMenuItem
                onSelect={() => navigate(`/trips/${id}/finish`)}
                disabled={isLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4 text-success" />
                Finalizar
              </DropdownMenuItem>
            ) : null}

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
        {/* Programar */}
        {canSchedule && (
          <Button
            size="sm"
            onClick={() =>
              setConfirmDialog({
                open: true,
                action: "schedule",
                title: "¿Programar este viaje?",
                description:
                  "El viaje pasará a estado 'Programado' y estará listo para iniciarse.",
              })
            }
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            Programar
          </Button>
        )}

        {/* Iniciar */}
        {canStart && (
          <Button
            size="sm"
            onClick={() => setStartDialogOpen(true)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Iniciar Viaje
          </Button>
        )}

        {/* Finalizar */}
        {canFinish && (
          <Button
            size="sm"
            onClick={() => navigate(`/trips/${id}/finish`)}
            disabled={isLoading}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar
          </Button>
        )}

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

        {/* Cancelar Viaje */}
        {canCancelTrip && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCancelDialog({ open: true, reason: "" })}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar Viaje
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
