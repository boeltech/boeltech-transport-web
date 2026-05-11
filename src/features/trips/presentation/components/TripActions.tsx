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
 *    <TripActions tripId={id} tripCode={code} status={status} variant="buttons" />
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
import { Input } from "@shared/ui/input";
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
  useStartTrip,
  useCancelTrip,
  useDeleteTrip,
} from "../../application";
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
  /** Variante de visualización: dropdown (default) o buttons */
  variant?: "dropdown" | "buttons";
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
  /** Callback después de una acción exitosa (usado en TripDetailPage) */
  onActionComplete?: () => void;
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

  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // ══════════════════════════════════════════════════════════════════════════
  // DIALOG STATES (solo para variant="buttons")
  // ══════════════════════════════════════════════════════════════════════════

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

  const [startDialog, setStartDialog] = useState<{
    open: boolean;
    mileage: string;
  }>({
    open: false,
    mileage: "",
  });

  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    reason: string;
  }>({
    open: false,
    reason: "",
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MUTATIONS (solo para variant="buttons")
  // ══════════════════════════════════════════════════════════════════════════

  const scheduleMutation = useScheduleTrip({
    onSuccess: () => {
      toast({
        title: "Viaje programado",
        description: `${code} está listo para iniciar`,
        variant: "success",
      });
      onActionComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error al programar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startMutation = useStartTrip({
    onSuccess: () => {
      toast({
        title: "Viaje iniciado",
        description: `${code} está en curso`,
        variant: "success",
      });
      onActionComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error al iniciar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useCancelTrip({
    onSuccess: () => {
      toast({
        title: "Viaje cancelado",
        description: code,
        variant: "success",
      });
      onActionComplete?.();
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
    startMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending;

  // ══════════════════════════════════════════════════════════════════════════
  // PERMISSIONS & AVAILABLE ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const canUpdate = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  const validTransitions = VALID_TRANSITIONS[currentStatus] || [];

  const canSchedule = validTransitions.includes("schedule") && canUpdate;
  const canStart = validTransitions.includes("start") && canUpdate;
  const canFinish = validTransitions.includes("finish") && canUpdate;
  const canCancelTrip = validTransitions.includes("cancel") && canUpdate;
  const canEditTrip = EDITABLE_STATUSES.includes(currentStatus) && canUpdate;
  const canDeleteTrip = validTransitions.includes("delete") && canDelete;

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

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

  const handleStartConfirm = () => {
    startMutation.mutate({
      id,
      mileage: startDialog.mileage
        ? parseInt(startDialog.mileage, 10)
        : undefined,
    });
    setStartDialog({ open: false, mileage: "" });
  };

  const handleCancelConfirm = () => {
    cancelMutation.mutate({
      id,
      reason: cancelDialog.reason || undefined,
    });
    setCancelDialog({ open: false, reason: "" });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: DROPDOWN MODE (para TripTable)
  // ══════════════════════════════════════════════════════════════════════════

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
                  <Calendar className="mr-2 h-4 w-4 text-blue-500" />
                  Programar
                </DropdownMenuItem>
              )}

              {canStart && onStart && (
                <DropdownMenuItem onClick={() => onStart(id)}>
                  <Play className="mr-2 h-4 w-4 text-green-500" />
                  Iniciar viaje
                </DropdownMenuItem>
              )}

              {canFinish && onFinish && (
                <DropdownMenuItem onClick={() => onFinish(id)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Finalizar viaje
                </DropdownMenuItem>
              )}

              {canCancelTrip && onCancel && (
                <DropdownMenuItem
                  onClick={() => onCancel(id)}
                  className="text-amber-600 focus:text-amber-600"
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

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: BUTTONS MODE (para TripDetailPage)
  // ══════════════════════════════════════════════════════════════════════════

  const hasNoActions =
    !canSchedule &&
    !canStart &&
    !canFinish &&
    !canCancelTrip &&
    !canEditTrip &&
    !canDeleteTrip;

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
            onClick={() => setStartDialog({ open: true, mileage: "" })}
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

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* Confirm Dialog (Schedule, Delete) */}
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

      {/* Start Trip Dialog */}
      <Dialog
        open={startDialog.open}
        onOpenChange={(open) => setStartDialog({ ...startDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <SectionHeadingWithHint
                title="Iniciar Viaje"
                titleClassName="text-lg font-semibold leading-none tracking-tight"
                hintLabel="Iniciar viaje"
                hint={
                  <>
                    El viaje {code} pasará a estado &quot;En Curso&quot;. Opcionalmente puede registrar el kilometraje
                    inicial.
                  </>
                }
              />
            </DialogTitle>
            <DialogDescription className="sr-only">
              El viaje pasará a en curso; puede registrar kilometraje inicial.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="start-mileage">
              Kilometraje inicial (opcional)
            </Label>
            <Input
              id="start-mileage"
              type="number"
              placeholder="Ej: 150000"
              value={startDialog.mileage}
              onChange={(e) =>
                setStartDialog({ ...startDialog, mileage: e.target.value })
              }
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStartDialog({ open: false, mileage: "" })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStartConfirm}
              disabled={startMutation.isPending}
            >
              {startMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Play className="mr-2 h-4 w-4" />
              Iniciar Viaje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Trip Dialog */}
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
}

export default TripActions;
