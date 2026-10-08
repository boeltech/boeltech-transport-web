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
 * Unidad dada de baja (`isActive === false`): solo «Ver detalles» y «Restaurar».
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleActions.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterActionFrom } from "@shared/utils/masterWayfinding";
import { Button } from "@shared/ui/button";
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
import { useUpdateVehicle } from "../../application";
import {
  VehicleStatus,
  VEHICLE_STATUS_LABELS,
  isBillableMotrizNow,
  type VehicleListItem,
  type Vehicle,
  type VehicleStatusType,
} from "../../domain";
import { vehiclesCopy } from "../copy";
import { VehicleBillingPolicyNote } from "./VehicleBillingPolicyNote";
import { VehicleDeactivateDialog } from "./VehicleDeactivateDialog";
import { VehicleRestoreDialog } from "./VehicleRestoreDialog";
import type { VehicleLifecycleTarget } from "./vehicleLifecycleTarget";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Archive,
  RotateCcw,
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
  isActive?: never;
}

/**
 * Props cuando se pasan valores individuales (usado en VehicleDetailPage)
 */
interface VehicleIndividualProps {
  vehicle?: never;
  vehicleId: string;
  vehicleName: string;
  status: VehicleStatusType;
  isActive?: boolean;
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
  /** Callback para dar de baja (solo en modo dropdown desde tabla) */
  onDeactivate?: (id: string) => void;
  /** Callback para restaurar una unidad dada de baja (solo en modo dropdown) */
  onRestore?: (id: string) => void;
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
    colorClass: "text-success",
  },
  [VehicleStatus.IN_MAINTENANCE]: {
    label: "Enviar a mantenimiento",
    icon: Wrench,
    colorClass: "text-warning",
  },
  [VehicleStatus.OUT_OF_SERVICE]: {
    label: "Marcar fuera de servicio",
    icon: XCircle,
    colorClass: "text-destructive",
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
    onDeactivate,
    onRestore,
    onChangeStatus,
    onMaintenance,
    onDocuments,
    onActionComplete,
  } = props;

  // Extraer valores del vehicle o de props individuales
  const id = props.vehicle?.id ?? props.vehicleId!;
  const name = props.vehicle?.unitNumber ?? props.vehicleName!;
  const currentStatus = props.vehicle?.status ?? props.status!;
  const isActive = (props.vehicle?.isActive ?? props.isActive) !== false;
  const billableNow = isBillableMotrizNow({
    type: props.vehicle?.type,
    status: currentStatus,
    isActive,
  });
  const lifecycleTarget: VehicleLifecycleTarget = {
    id,
    unitNumber: name,
    type: props.vehicle?.type,
    status: currentStatus,
    isActive,
  };

  const navigate = useNavigate();
  const fromState = useMasterActionFrom("/vehicles");
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // ══════════════════════════════════════════════════════════════════════════
  // DIALOG STATES (solo para variant="buttons")
  // ══════════════════════════════════════════════════════════════════════════

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

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

  const isLoading = updateMutation.isPending;

  // ══════════════════════════════════════════════════════════════════════════
  // PERMISSIONS & AVAILABLE ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const canUpdate = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");

  const availableTransitions = isActive
    ? VALID_STATUS_TRANSITIONS[currentStatus] || []
    : [];

  // No se puede dar de baja si está en viaje
  const canDeactivateVehicle =
    isActive && currentStatus !== VehicleStatus.ON_TRIP && canDelete;
  const canRestoreVehicle = !isActive && canUpdate;

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

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
    if (!isActive) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menú de acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {onView && (
              <DropdownMenuItem onClick={() => onView(id)}>
                <Eye className="mr-2 h-4 w-4" />
                {vehiclesCopy.lifecycle.viewDetail}
              </DropdownMenuItem>
            )}
            {canRestoreVehicle && onRestore && (
              <DropdownMenuItem onClick={() => onRestore(id)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {vehiclesCopy.restore.action}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

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
              {vehiclesCopy.lifecycle.viewDetail}
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

          {/* Dar de baja */}
          {canDeactivateVehicle && onDeactivate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDeactivate(id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Archive className="mr-2 h-4 w-4" />
                {vehiclesCopy.deactivate.action}
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

  if (!isActive) {
    if (!canRestoreVehicle) return null;
    return (
      <>
        <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setRestoreOpen(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {vehiclesCopy.restore.action}
          </Button>
        </div>
        <VehicleRestoreDialog
          vehicle={lifecycleTarget}
          open={restoreOpen}
          onOpenChange={setRestoreOpen}
          onRestored={() => onActionComplete?.()}
        />
      </>
    );
  }

  const hasNoActions =
    !canUpdate && !canDeactivateVehicle && availableTransitions.length === 0;

  if (hasNoActions) {
    return null;
  }

  return (
    <>
      <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
        {/* Editar */}
        {canUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/vehicles/${id}/edit`, { state: fromState })
            }
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

        {/* Dar de baja */}
        {canDeactivateVehicle && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeactivateOpen(true)}
            disabled={isLoading}
          >
            <Archive className="mr-2 h-4 w-4" />
            {vehiclesCopy.deactivate.action}
          </Button>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <VehicleDeactivateDialog
        vehicle={lifecycleTarget}
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        onDeactivated={() => navigate("/vehicles")}
      />

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
              {billableNow &&
              statusDialog.targetStatus === VehicleStatus.OUT_OF_SERVICE ? (
                <>
                  {" "}
                  <VehicleBillingPolicyNote kind="remove" />
                </>
              ) : null}
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
