/**
 * VehicleActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Menú de acciones para un vehículo individual.
 * Soporta dos modos de uso:
 *
 * 1. Con objeto vehicle (para VehicleTable):
 *    <VehicleActions vehicle={vehicle} onView={...} onEdit={...} />
 *
 * 2. Con props individuales (para VehicleDetailPage):
 *    <VehicleActions vehicleId={id} vehicleName={name} status={status} variant="buttons" />
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleActions.tsx
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
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { useUpdateVehicle, useDeleteVehicle } from "../../application";
import {
  VehicleStatus,
  VEHICLE_STATUS_LABELS,
  type VehicleListItem,
  type Vehicle,
  type VehicleStatusType,
} from "../../domain";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Wrench,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props cuando se pasa el objeto vehicle completo (usado en VehicleTable)
 */
interface VehicleObjectProps {
  vehicle: VehicleListItem | Vehicle;
  vehicleId?: never;
  vehicleName?: never;
  status?: never;
}

/**
 * Props cuando se pasan valores individuales (usado en VehicleDetailPage)
 */
interface VehicleIndividualProps {
  vehicle?: never;
  vehicleId: string;
  vehicleName: string;
  status: VehicleStatusType;
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
  onChangeStatus?: (id: string, status: VehicleStatusType) => void;
  /** Callback para historial de mantenimiento */
  onMaintenance?: (id: string) => void;
  /** Callback para documentos */
  onDocuments?: (id: string) => void;
  /** Callback después de una acción exitosa (usado en VehicleDetailPage) */
  onActionComplete?: () => void;
}

type VehicleActionsProps = CommonProps &
  (VehicleObjectProps | VehicleIndividualProps);

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  [VehicleStatus.AVAILABLE]: [
    VehicleStatus.IN_MAINTENANCE,
    VehicleStatus.OUT_OF_SERVICE,
  ],
  [VehicleStatus.IN_MAINTENANCE]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.OUT_OF_SERVICE,
  ],
  [VehicleStatus.OUT_OF_SERVICE]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.IN_MAINTENANCE,
  ],
  [VehicleStatus.ON_TRIP]: [], // No se puede cambiar manualmente mientras está en viaje
};

const STATUS_ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof CheckCircle; colorClass: string }
> = {
  [VehicleStatus.AVAILABLE]: {
    label: "Marcar disponible",
    icon: CheckCircle,
    colorClass: "text-green-500",
  },
  [VehicleStatus.IN_MAINTENANCE]: {
    label: "Enviar a mantenimiento",
    icon: Wrench,
    colorClass: "text-amber-500",
  },
  [VehicleStatus.OUT_OF_SERVICE]: {
    label: "Marcar fuera de servicio",
    icon: XCircle,
    colorClass: "text-red-500",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleActions(props: VehicleActionsProps) {
  const {
    variant = "dropdown",
    onView,
    onEdit,
    onDelete,
    onChangeStatus,
    onMaintenance,
    onDocuments,
    onActionComplete,
  } = props;

  // Extraer valores del vehicle o de props individuales
  const id = props.vehicle?.id ?? props.vehicleId!;
  const name = props.vehicle?.unitNumber ?? props.vehicleName!;
  const currentStatus = props.vehicle?.status ?? props.status!;

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
    targetStatus: VehicleStatusType | null;
    reason: string;
  }>({
    open: false,
    targetStatus: null,
    reason: "",
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MUTATIONS (solo para variant="buttons")
  // ══════════════════════════════════════════════════════════════════════════

  const updateMutation = useUpdateVehicle({
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: `${name} ahora está ${VEHICLE_STATUS_LABELS[statusDialog.targetStatus!] || statusDialog.targetStatus}`,
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

  const deleteMutation = useDeleteVehicle({
    onSuccess: () => {
      toast({ title: "Vehículo eliminado", variant: "success" });
      navigate("/vehicles");
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = updateMutation.isPending || deleteMutation.isPending;

  // ══════════════════════════════════════════════════════════════════════════
  // PERMISSIONS & AVAILABLE ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const canUpdate = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");

  const availableTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

  // No se puede eliminar si está en viaje
  const canDeleteVehicle = currentStatus !== VehicleStatus.ON_TRIP && canDelete;

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(id);
  };

  const handleStatusConfirm = () => {
    if (!statusDialog.targetStatus) return;
    updateMutation.mutate({
      id,
      data: {
        status: statusDialog.targetStatus,
      },
    });
  };

  const openStatusDialog = (targetStatus: VehicleStatusType) => {
    setStatusDialog({ open: true, targetStatus, reason: "" });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: DROPDOWN MODE (para VehicleTable)
  // ══════════════════════════════════════════════════════════════════════════

  if (variant === "dropdown") {
    const hasStatusActions =
      canUpdate && onChangeStatus && availableTransitions.length > 0;
    const hasSecondaryActions = onMaintenance || onDocuments;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menú de acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
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

          {/* Acciones secundarias */}
          {hasSecondaryActions && (
            <>
              <DropdownMenuSeparator />

              {onMaintenance && (
                <DropdownMenuItem onClick={() => onMaintenance(id)}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Historial mantenimiento
                </DropdownMenuItem>
              )}

              {onDocuments && (
                <DropdownMenuItem onClick={() => onDocuments(id)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Documentos
                </DropdownMenuItem>
              )}
            </>
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
                    onClick={() =>
                      onChangeStatus(id, targetStatus as VehicleStatusType)
                    }
                  >
                    <Icon className={`mr-2 h-4 w-4 ${config.colorClass}`} />
                    {config.label}
                  </DropdownMenuItem>
                );
              })}
            </>
          )}

          {/* Eliminar */}
          {canDeleteVehicle && onDelete && (
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
  // RENDER: BUTTONS MODE (para VehicleDetailPage)
  // ══════════════════════════════════════════════════════════════════════════

  const hasNoActions =
    !canUpdate && !canDeleteVehicle && availableTransitions.length === 0;

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
            onClick={() => navigate(`/vehicles/${id}/edit`)}
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
                    onClick={() =>
                      openStatusDialog(targetStatus as VehicleStatusType)
                    }
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
        {canDeleteVehicle && (
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
            <AlertDialogTitle>¿Eliminar este vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El vehículo{" "}
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
            <DialogTitle>Cambiar Estado del Vehículo</DialogTitle>
            <DialogDescription>
              El vehículo <strong>{name}</strong> pasará de{" "}
              <strong>{VEHICLE_STATUS_LABELS[currentStatus]}</strong> a{" "}
              <strong>
                {statusDialog.targetStatus
                  ? VEHICLE_STATUS_LABELS[statusDialog.targetStatus]
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
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

export default VehicleActions;
