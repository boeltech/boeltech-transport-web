/**
 * DriverActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Menú de acciones para un conductor individual.
 * Soporta dos modos de uso:
 *
 * 1. Con objeto driver (para DriverTable):
 *    <DriverActions driver={driver} onView={...} onEdit={...} />
 *
 * 2. Con props individuales (para DriverDetailPage):
 *    <DriverActions driverId={id} driverName={name} status={status} variant="buttons" />
 *
 * Ubicación: src/features/drivers/presentation/components/DriverActions.tsx
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@shared/ui/select";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { useUpdateDriverStatus, useDeleteDriver } from "../../application";
import {
  DriverStatus,
  VALID_STATUS_TRANSITIONS,
  DRIVER_STATUS_LABELS,
  type DriverListItem,
  type Driver,
  type DriverStatusType,
} from "../../domain";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Coffee,
  Palmtree,
  CalendarOff,
  Loader2,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props cuando se pasa el objeto driver completo (usado en DriverTable)
 */
interface DriverObjectProps {
  driver: DriverListItem | Driver;
  driverId?: never;
  driverName?: never;
  status?: never;
}

/**
 * Props cuando se pasan valores individuales (usado en DriverDetailPage)
 */
interface DriverIndividualProps {
  driver?: never;
  driverId: string;
  driverName: string;
  status: DriverStatusType;
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
  /** Callback para cambio de estado (solo en modo dropdown desde tabla) */
  onChangeStatus?: (id: string, status: DriverStatusType) => void;
  /** Callback después de una acción exitosa (usado en DriverDetailPage) */
  onActionComplete?: () => void;
}

type DriverActionsProps = CommonProps &
  (DriverObjectProps | DriverIndividualProps);

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof UserCheck; colorClass: string }
> = {
  [DriverStatus.AVAILABLE]: {
    label: "Marcar disponible",
    icon: UserCheck,
    colorClass: "text-green-500",
  },
  [DriverStatus.RESTING]: {
    label: "Marcar en descanso",
    icon: Coffee,
    colorClass: "text-blue-500",
  },
  [DriverStatus.ON_VACATION]: {
    label: "Marcar en vacaciones",
    icon: Palmtree,
    colorClass: "text-purple-500",
  },
  [DriverStatus.ON_LEAVE]: {
    label: "Marcar con permiso",
    icon: CalendarOff,
    colorClass: "text-amber-500",
  },
  [DriverStatus.TERMINATED]: {
    label: "Dar de baja",
    icon: UserX,
    colorClass: "text-red-500",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverActions(props: DriverActionsProps) {
  const {
    variant = "dropdown",
    onView,
    onEdit,
    onDelete,
    onChangeStatus,
    onActionComplete,
  } = props;

  // Extraer valores del driver o de props individuales
  const id = props.driver?.id ?? props.driverId!;
  const name = props.driver
    ? "employee" in props.driver && props.driver.employee
      ? `${props.driver.employee.firstName} ${props.driver.employee.lastName}`
      : "Conductor"
    : props.driverName!;
  const currentStatus = props.driver?.status ?? props.status!;

  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // ══════════════════════════════════════════════════════════════════════════
  // DIALOG STATES (solo para variant="buttons")
  // ══════════════════════════════════════════════════════════════════════════

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean }>({
    open: false,
  });

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    targetStatus: DriverStatusType | null;
    reason: string;
  }>({
    open: false,
    targetStatus: null,
    reason: "",
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MUTATIONS (solo para variant="buttons")
  // ══════════════════════════════════════════════════════════════════════════

  const updateStatusMutation = useUpdateDriverStatus({
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: `${name} ahora está ${DRIVER_STATUS_LABELS[statusDialog.targetStatus!] || statusDialog.targetStatus}`,
        variant: "success",
      });
      setStatusDialog({ open: false, targetStatus: null, reason: "" });
      onActionComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useDeleteDriver({
    onSuccess: () => {
      toast({ title: "Conductor eliminado", variant: "success" });
      navigate("/drivers");
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = updateStatusMutation.isPending || deleteMutation.isPending;

  // ══════════════════════════════════════════════════════════════════════════
  // PERMISSIONS & AVAILABLE ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const canUpdate = hasPermission("drivers", "update");
  const canDelete = hasPermission("drivers", "delete");

  const availableTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  // No se puede eliminar si está en viaje
  const canDeleteDriver = currentStatus !== DriverStatus.ON_TRIP && canDelete;

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(id);
  };

  const handleStatusConfirm = () => {
    if (!statusDialog.targetStatus) return;
    updateStatusMutation.mutate({
      id,
      data: {
        status: statusDialog.targetStatus,
        reason: statusDialog.reason || undefined,
      },
    });
  };

  const openStatusDialog = (targetStatus: DriverStatusType) => {
    setStatusDialog({ open: true, targetStatus, reason: "" });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: DROPDOWN MODE (para DriverTable)
  // ══════════════════════════════════════════════════════════════════════════

  if (variant === "dropdown") {
    const hasStatusActions =
      canUpdate && onChangeStatus && availableTransitions.length > 0;

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
          {canUpdate && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

          {/* Acciones de cambio de estado */}
          {hasStatusActions && (
            <>
              <DropdownMenuSeparator />
              {availableTransitions.map((targetStatus) => {
                const config = STATUS_ACTION_CONFIG[targetStatus];
                if (!config) return null;

                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={targetStatus}
                    onClick={() => onChangeStatus(id, targetStatus)}
                  >
                    <Icon className={`mr-2 h-4 w-4 ${config.colorClass}`} />
                    {config.label}
                  </DropdownMenuItem>
                );
              })}
            </>
          )}

          {/* Eliminar */}
          {canDeleteDriver && onDelete && (
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
  // RENDER: BUTTONS MODE (para DriverDetailPage)
  // ══════════════════════════════════════════════════════════════════════════

  const hasNoActions =
    !canUpdate && !canDeleteDriver && availableTransitions.length === 0;

  if (hasNoActions) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Editar */}
        {canUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/drivers/${id}/edit`)}
            disabled={isLoading}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}

        {/* Cambiar Estado (dropdown dentro del modo buttons) */}
        {canUpdate && availableTransitions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Cambiar Estado
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableTransitions.map((targetStatus) => {
                const config = STATUS_ACTION_CONFIG[targetStatus];
                if (!config) return null;

                const Icon = config.icon;
                return (
                  <DropdownMenuItem
                    key={targetStatus}
                    onClick={() => openStatusDialog(targetStatus)}
                  >
                    <Icon className={`mr-2 h-4 w-4 ${config.colorClass}`} />
                    {config.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Eliminar */}
        {canDeleteDriver && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialog({ open: true })}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este conductor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El conductor{" "}
              <strong>{name}</strong> será eliminado permanentemente del
              sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) =>
          setStatusDialog({ ...statusDialog, open, reason: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Conductor</DialogTitle>
            <DialogDescription>
              El conductor <strong>{name}</strong> pasará de{" "}
              <strong>{DRIVER_STATUS_LABELS[currentStatus]}</strong> a{" "}
              <strong>
                {statusDialog.targetStatus
                  ? DRIVER_STATUS_LABELS[statusDialog.targetStatus]
                  : ""}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="status-reason">Motivo (opcional)</Label>
              <Textarea
                id="status-reason"
                placeholder="Ingrese el motivo del cambio de estado..."
                value={statusDialog.reason}
                onChange={(e) =>
                  setStatusDialog({ ...statusDialog, reason: e.target.value })
                }
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setStatusDialog({ open: false, targetStatus: null, reason: "" })
              }
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusConfirm}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Cambio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DriverActions;
