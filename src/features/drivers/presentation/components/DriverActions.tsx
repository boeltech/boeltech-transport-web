/**
 * DriverActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Menú de acciones para un conductor individual.
 * Soporta dos modos de uso:
 *
 * 1. Con objeto driver (para DriverTable / DriverCard):
 *    <DriverActions driver={driver} onView={...} onEdit={...} />
 *
 * 2. Con props individuales (para DriverDetailPage):
 *    <DriverActions driverId={id} driverName={name} status={status} variant="buttons" />
 *
 * Cambio de estado operativo: solo en detalle (`variant="buttons"`) — D1.
 *
 * Ubicación: src/features/drivers/presentation/components/DriverActions.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterActionFrom } from "@shared/utils/masterWayfinding";
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
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
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
import { driversCopy } from "../copy";
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
    colorClass: "text-success",
  },
  [DriverStatus.RESTING]: {
    label: "Marcar en descanso",
    icon: Coffee,
    colorClass: "text-info",
  },
  [DriverStatus.ON_VACATION]: {
    label: "Marcar en vacaciones",
    icon: Palmtree,
    colorClass: "text-info",
  },
  [DriverStatus.ON_LEAVE]: {
    label: "Marcar con permiso",
    icon: CalendarOff,
    colorClass: "text-warning",
  },
  [DriverStatus.TERMINATED]: {
    label: "Dar de baja",
    icon: UserX,
    colorClass: "text-destructive",
  },
};

const statusCopy = driversCopy.detail.statusChange;

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverActions(props: DriverActionsProps) {
  const {
    variant = "dropdown",
    onView,
    onEdit,
    onDelete,
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
  const fromState = useMasterActionFrom("/drivers");
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
  }>({
    open: false,
    targetStatus: null,
  });
  const [statusError, setStatusError] = useState<string | null>(null);

  // ══════════════════════════════════════════════════════════════════════════
  // MUTATIONS (solo para variant="buttons")
  // ══════════════════════════════════════════════════════════════════════════

  const updateStatusMutation = useUpdateDriverStatus({
    onSuccess: () => {
      const target = statusDialog.targetStatus;
      toast({
        title: statusCopy.successTitle,
        description: statusCopy.successDescription(
          name,
          (target && DRIVER_STATUS_LABELS[target]) || target || "",
        ),
        variant: "success",
      });
      setStatusError(null);
      setStatusDialog({ open: false, targetStatus: null });
      onActionComplete?.();
    },
    onError: (error) => {
      setStatusError(error.message);
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
    if (deleteMutation.isPending) return;
    deleteMutation.mutate(id);
  };

  const handleStatusConfirm = () => {
    if (!statusDialog.targetStatus) return;
    setStatusError(null);
    updateStatusMutation.mutate({
      id,
      data: {
        status: statusDialog.targetStatus,
      },
    });
  };

  const openStatusDialog = (targetStatus: DriverStatusType) => {
    setStatusError(null);
    setStatusDialog({ open: true, targetStatus });
  };

  const closeStatusDialog = () => {
    setStatusError(null);
    setStatusDialog({ open: false, targetStatus: null });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: DROPDOWN MODE (para DriverTable) — sin cambio de estado (D1)
  // ══════════════════════════════════════════════════════════════════════════

  if (variant === "dropdown") {
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

          {canUpdate && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}

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

  const targetLabel = statusDialog.targetStatus
    ? DRIVER_STATUS_LABELS[statusDialog.targetStatus]
    : "";

  return (
    <>
      <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
        {/* Primaria del header = Editar (D7) */}
        {canUpdate && (
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              navigate(`/drivers/${id}/edit`, { state: fromState })
            }
            disabled={isLoading}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}

        {canUpdate && availableTransitions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Cambiar estado
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

        {/* Eliminar: outline, no primaria sólida (D7) */}
        {canDeleteDriver && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialog({ open: true })}
            disabled={isLoading}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        )}
      </div>

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
              disabled={deleteMutation.isPending}
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

      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) => {
          if (!open) closeStatusDialog();
          else setStatusDialog((prev) => ({ ...prev, open }));
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statusCopy.title}</DialogTitle>
            <DialogDescription>
              {statusCopy.description(
                name,
                DRIVER_STATUS_LABELS[currentStatus],
                targetLabel,
              )}
            </DialogDescription>
          </DialogHeader>
          {statusError ? (
            <Alert variant="destructive">
              <AlertTitle>{statusCopy.errorTitle}</AlertTitle>
              <AlertDescription className="select-text whitespace-pre-wrap break-words">
                {statusError}
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={closeStatusDialog}>
              {statusCopy.cancel}
            </Button>
            <Button
              onClick={handleStatusConfirm}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {statusCopy.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DriverActions;
