/**
 * TripActions Component
 *
 * Componente que muestra las acciones disponibles para un viaje
 * según su estado actual y los permisos del usuario.
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
} from "@features/trips/application";
import type { TripStatusType } from "@features/trips/domain";
import {
  MoreHorizontal,
  Calendar,
  Play,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface TripActionsProps {
  tripId: string;
  tripCode: string;
  status: TripStatusType;
  /** Variante de visualización */
  variant?: "buttons" | "dropdown" | "both";
  /** Callback después de una acción exitosa */
  onActionComplete?: () => void;
  /** Mostrar solo acciones principales */
  compact?: boolean;
}

interface ConfirmDialogState {
  open: boolean;
  action: "schedule" | "start" | "cancel" | "delete" | null;
  title: string;
  description: string;
}

interface StartTripDialogState {
  open: boolean;
  mileage: string;
}

interface CancelTripDialogState {
  open: boolean;
  reason: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTION_CONFIG = {
  schedule: {
    label: "Programar",
    icon: Calendar,
    variant: "default" as const,
    confirmTitle: "¿Programar este viaje?",
    confirmDescription:
      "El viaje pasará a estado 'Programado' y estará listo para iniciarse.",
  },
  start: {
    label: "Iniciar Viaje",
    icon: Play,
    variant: "default" as const,
    confirmTitle: "¿Iniciar este viaje?",
    confirmDescription:
      "El viaje pasará a estado 'En Curso'. El vehículo y conductor quedarán marcados como ocupados.",
  },
  finish: {
    label: "Finalizar",
    icon: CheckCircle,
    variant: "default" as const,
  },
  cancel: {
    label: "Cancelar Viaje",
    icon: XCircle,
    variant: "outline" as const,
    confirmTitle: "¿Cancelar este viaje?",
    confirmDescription:
      "Esta acción no se puede deshacer. El vehículo y conductor volverán a estar disponibles.",
  },
  edit: {
    label: "Editar",
    icon: Edit,
    variant: "outline" as const,
  },
  delete: {
    label: "Eliminar",
    icon: Trash2,
    variant: "destructive" as const,
    confirmTitle: "¿Eliminar este viaje?",
    confirmDescription:
      "Esta acción no se puede deshacer. El viaje será eliminado permanentemente.",
  },
};

/**
 * Define qué acciones están disponibles para cada estado
 */
const ACTIONS_BY_STATUS: Record<
  TripStatusType,
  (keyof typeof ACTION_CONFIG)[]
> = {
  draft: ["schedule", "edit", "cancel", "delete"],
  scheduled: ["start", "edit", "cancel"],
  in_progress: ["finish", "cancel"],
  completed: [],
  cancelled: [],
};

// ============================================================================
// COMPONENT
// ============================================================================

export function TripActions({
  tripId,
  tripCode,
  status,
  variant = "both",
  onActionComplete,
  compact = false,
}: TripActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    title: "",
    description: "",
  });
  const [startDialog, setStartDialog] = useState<StartTripDialogState>({
    open: false,
    mileage: "",
  });
  const [cancelDialog, setCancelDialog] = useState<CancelTripDialogState>({
    open: false,
    reason: "",
  });

  // Mutations
  const scheduleMutation = useScheduleTrip({
    onSuccess: () => {
      toast({
        title: "Viaje programado",
        description: `${tripCode} está listo para iniciar`,
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
        description: `${tripCode} está en curso`,
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
        description: tripCode,
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

  // Permissions
  const canUpdate = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  // Get available actions for current status
  const availableActions = ACTIONS_BY_STATUS[status] || [];

  // Filter actions based on permissions
  const filteredActions = availableActions.filter((action) => {
    if (action === "edit" && !canUpdate) return false;
    if (action === "delete" && !canDelete) return false;
    if (["schedule", "start", "cancel"].includes(action) && !canUpdate)
      return false;
    return true;
  });

  // No actions available
  if (filteredActions.length === 0) {
    return null;
  }

  // ============================================
  // Handlers
  // ============================================

  const handleAction = (action: keyof typeof ACTION_CONFIG) => {
    switch (action) {
      case "schedule":
        setConfirmDialog({
          open: true,
          action: "schedule",
          title: ACTION_CONFIG.schedule.confirmTitle,
          description: ACTION_CONFIG.schedule.confirmDescription,
        });
        break;

      case "start":
        setStartDialog({ open: true, mileage: "" });
        break;

      case "finish":
        navigate(`/trips/${tripId}/finish`);
        break;

      case "cancel":
        setCancelDialog({ open: true, reason: "" });
        break;

      case "edit":
        navigate(`/trips/${tripId}/edit`);
        break;

      case "delete":
        setConfirmDialog({
          open: true,
          action: "delete",
          title: ACTION_CONFIG.delete.confirmTitle,
          description: ACTION_CONFIG.delete.confirmDescription,
        });
        break;
    }
  };

  const handleConfirm = () => {
    switch (confirmDialog.action) {
      case "schedule":
        scheduleMutation.mutate(tripId);
        break;
      case "delete":
        deleteMutation.mutate(tripId);
        break;
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleStartConfirm = () => {
    startMutation.mutate({
      id: tripId,
      mileage: startDialog.mileage
        ? parseInt(startDialog.mileage, 10)
        : undefined,
    });
    setStartDialog({ open: false, mileage: "" });
  };

  const handleCancelConfirm = () => {
    cancelMutation.mutate({
      id: tripId,
      reason: cancelDialog.reason || undefined,
    });
    setCancelDialog({ open: false, reason: "" });
  };

  // ============================================
  // Render helpers
  // ============================================

  const renderButton = (action: keyof typeof ACTION_CONFIG) => {
    const config = ACTION_CONFIG[action];
    const Icon = config.icon;
    const isPrimary = ["schedule", "start", "finish"].includes(action);

    // En modo compacto, solo mostrar acciones principales como botones
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

  const renderDropdownItem = (action: keyof typeof ACTION_CONFIG) => {
    const config = ACTION_CONFIG[action];
    const Icon = config.icon;
    const isDestructive = action === "delete" || action === "cancel";

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

  // Separar acciones principales de secundarias para el dropdown
  const primaryActions = filteredActions.filter((a) =>
    ["schedule", "start", "finish"].includes(a),
  );
  const secondaryActions = filteredActions.filter(
    (a) => !["schedule", "start", "finish"].includes(a),
  );

  // ============================================
  // Render
  // ============================================

  return (
    <>
      {/* Buttons */}
      {(variant === "buttons" || variant === "both") && (
        <div className="flex flex-wrap items-center gap-2">
          {filteredActions.map(renderButton)}
        </div>
      )}

      {/* Dropdown */}
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
            {primaryActions.map(renderDropdownItem)}
            {primaryActions.length > 0 && secondaryActions.length > 0 && (
              <DropdownMenuSeparator />
            )}
            {secondaryActions.map(renderDropdownItem)}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Confirm Dialog (Schedule, Delete) */}
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
            <DialogTitle>Iniciar Viaje</DialogTitle>
            <DialogDescription>
              El viaje {tripCode} pasará a estado "En Curso". Opcionalmente
              puede registrar el kilometraje inicial.
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
            <DialogTitle>Cancelar Viaje</DialogTitle>
            <DialogDescription>
              El viaje {tripCode} será cancelado. Esta acción no se puede
              deshacer.
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
