/**
 * VehicleActions Component
 *
 * Componente que muestra las acciones disponibles para un vehículo
 * según su estado actual y los permisos del usuario.
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { usePermissions } from "@shared/permissions";
import { useAuth } from "@features/auth";
import { useToast } from "@shared/hooks";
import {
  useUpdateVehicleStatus,
  useDeleteVehicle,
} from "@features/vehicles/application";
import type {
  VehicleListItem,
  Vehicle,
  VehicleStatusType,
} from "@features/vehicles/domain";
import { VALID_STATUS_TRANSITIONS } from "@features/vehicles/domain";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Wrench,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

type VehicleActionTarget = VehicleListItem | Vehicle;

interface VehicleActionsProps {
  vehicle: VehicleActionTarget;
  /** Variante de visualización */
  variant?: "buttons" | "dropdown" | "both";
  /** Callback después de una acción exitosa */
  onActionComplete?: () => void;
  /** Mostrar solo acciones principales */
  compact?: boolean;
}

type VehicleActionType =
  | "view"
  | "edit"
  | "to_available"
  | "to_on_trip"
  | "to_in_maintenance"
  | "to_out_of_service"
  | "delete";

interface ConfirmDialogState {
  open: boolean;
  action: VehicleActionType | null;
  title: string;
  description: string;
  destructive: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTION_CONFIG: Record<
  VehicleActionType,
  {
    label: string;
    icon: typeof Eye;
    variant: "default" | "outline" | "destructive";
    confirmTitle?: string;
    confirmDescription?: string;
  }
> = {
  view: {
    label: "Ver detalle",
    icon: Eye,
    variant: "outline",
  },
  edit: {
    label: "Editar",
    icon: Pencil,
    variant: "outline",
  },
  to_available: {
    label: "Cambiar a Disponible",
    icon: CheckCircle2,
    variant: "default",
    confirmTitle: "¿Marcar como disponible?",
    confirmDescription:
      "El vehículo quedará disponible para ser asignado a viajes.",
  },
  to_on_trip: {
    label: "Cambiar a En Viaje",
    icon: Truck,
    variant: "default",
    confirmTitle: "¿Marcar como en viaje?",
    confirmDescription:
      "El vehículo será marcado como en viaje y no podrá asignarse a otros viajes.",
  },
  to_in_maintenance: {
    label: "Enviar a Mantenimiento",
    icon: Wrench,
    variant: "outline",
    confirmTitle: "¿Enviar a mantenimiento?",
    confirmDescription:
      "El vehículo será marcado como en mantenimiento y no estará disponible.",
  },
  to_out_of_service: {
    label: "Fuera de Servicio",
    icon: XCircle,
    variant: "destructive",
    confirmTitle: "¿Marcar como fuera de servicio?",
    confirmDescription:
      "El vehículo quedará fuera de servicio. Solo administradores podrán reactivarlo.",
  },
  delete: {
    label: "Eliminar",
    icon: Trash2,
    variant: "destructive",
    confirmTitle: "¿Eliminar este vehículo?",
    confirmDescription:
      "El vehículo será dado de baja (fuera de servicio e inactivo). Esta acción no se puede deshacer.",
  },
};

const STATUS_TO_ACTION: Record<VehicleStatusType, VehicleActionType> = {
  available: "to_available",
  on_trip: "to_on_trip",
  in_maintenance: "to_in_maintenance",
  out_of_service: "to_out_of_service",
};

const ACTION_TO_STATUS: Partial<Record<VehicleActionType, VehicleStatusType>> =
  {
    to_available: "available",
    to_on_trip: "on_trip",
    to_in_maintenance: "in_maintenance",
    to_out_of_service: "out_of_service",
  };

/**
 * Define qué acciones están disponibles para cada estado.
 * Incluye navegación (view, edit) + transiciones + delete.
 */
function getActionsForVehicle(status: VehicleStatusType): VehicleActionType[] {
  const transitions = VALID_STATUS_TRANSITIONS[status] || [];
  const transitionActions = transitions.map((s) => STATUS_TO_ACTION[s]);

  const actions: VehicleActionType[] = ["view"];

  if (status !== "out_of_service") {
    actions.push("edit");
  }

  actions.push(...transitionActions);

  if (status !== "on_trip") {
    actions.push("delete");
  }

  return actions;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleActions({
  vehicle,
  variant = "dropdown",
  onActionComplete,
  compact = false,
}: VehicleActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    title: "",
    description: "",
    destructive: false,
  });

  // Mutations
  const updateStatus = useUpdateVehicleStatus({
    onSuccess: () => {
      toast({
        title: "Estado actualizado",
        description: `${vehicle.unitNumber} actualizado exitosamente`,
        variant: "success",
      });
      onActionComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error al cambiar estado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useDeleteVehicle({
    onSuccess: () => {
      toast({
        title: "Vehículo eliminado",
        description: `${vehicle.unitNumber} fue dado de baja`,
        variant: "success",
      });
      onActionComplete?.();
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = updateStatus.isPending || deleteMutation.isPending;

  // ── Permissions ──
  const canRead = hasPermission("vehicles", "read");
  const canUpdate = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");
  const hasFullAccess = ["admin", "gerente"].includes(user?.role ?? "");

  const allActions = getActionsForVehicle(vehicle.status);

  const filteredActions = allActions.filter((action) => {
    if (action === "view" && !canRead) return false;
    if (action === "edit" && !canUpdate) return false;
    if (action === "delete" && !canDelete) return false;
    if (action === "to_out_of_service" && !hasFullAccess) return false;
    if (
      ["to_available", "to_on_trip", "to_in_maintenance"].includes(action) &&
      !canUpdate
    )
      return false;
    return true;
  });

  if (filteredActions.length === 0) {
    return null;
  }

  // ============================================
  // Handlers
  // ============================================

  const handleAction = (action: VehicleActionType) => {
    switch (action) {
      case "view":
        navigate(`/vehicles/${vehicle.id}`);
        break;

      case "edit":
        navigate(`/vehicles/${vehicle.id}/edit`);
        break;

      case "to_available":
      case "to_on_trip":
      case "to_in_maintenance":
      case "to_out_of_service": {
        const config = ACTION_CONFIG[action];
        setConfirmDialog({
          open: true,
          action,
          title: config.confirmTitle!,
          description: config.confirmDescription!,
          destructive: action === "to_out_of_service",
        });
        break;
      }

      case "delete":
        setConfirmDialog({
          open: true,
          action: "delete",
          title: ACTION_CONFIG.delete.confirmTitle!,
          description: ACTION_CONFIG.delete.confirmDescription!,
          destructive: true,
        });
        break;
    }
  };

  const handleConfirm = () => {
    const { action } = confirmDialog;

    if (action === "delete") {
      deleteMutation.mutate(vehicle.id);
    } else if (action) {
      const targetStatus = ACTION_TO_STATUS[action];
      if (targetStatus) {
        updateStatus.mutate({ id: vehicle.id, status: targetStatus });
      }
    }

    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // ============================================
  // Render helpers
  // ============================================

  const renderButton = (action: VehicleActionType) => {
    const config = ACTION_CONFIG[action];
    const Icon = config.icon;
    const isPrimary = [
      "to_available",
      "to_in_maintenance",
      "to_out_of_service",
    ].includes(action);

    if (compact && !isPrimary) return null;

    return (
      <Button
        key={action}
        variant={config.variant}
        size="sm"
        onClick={() => handleAction(action)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="mr-2 h-4 w-4" />
        )}
        {config.label}
      </Button>
    );
  };

  const renderDropdownItem = (action: VehicleActionType) => {
    const config = ACTION_CONFIG[action];
    const Icon = config.icon;
    const isDestructive = action === "delete" || action === "to_out_of_service";

    return (
      <DropdownMenuItem
        key={action}
        onClick={() => handleAction(action)}
        disabled={isLoading}
        className={
          isDestructive ? "text-destructive focus:text-destructive" : ""
        }
      >
        <Icon className="mr-2 h-4 w-4" />
        {config.label}
      </DropdownMenuItem>
    );
  };

  const navigationActions = filteredActions.filter((a) =>
    ["view", "edit"].includes(a),
  );
  const statusActions = filteredActions.filter((a) => a.startsWith("to_"));
  const destructiveActions = filteredActions.filter((a) => a === "delete");

  // ============================================
  // Render
  // ============================================

  return (
    <>
      {(variant === "buttons" || variant === "both") && (
        <div className="flex flex-wrap items-center gap-2">
          {filteredActions.map(renderButton)}
        </div>
      )}

      {(variant === "dropdown" || (variant === "both" && compact)) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {navigationActions.map(renderDropdownItem)}
            {navigationActions.length > 0 && statusActions.length > 0 && (
              <DropdownMenuSeparator />
            )}
            {statusActions.map(renderDropdownItem)}
            {(navigationActions.length > 0 || statusActions.length > 0) &&
              destructiveActions.length > 0 && <DropdownMenuSeparator />}
            {destructiveActions.map(renderDropdownItem)}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                confirmDialog.destructive
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default VehicleActions;
