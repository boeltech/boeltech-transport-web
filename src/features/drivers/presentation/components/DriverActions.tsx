/**
 * DriverActions Component
 * Clean Architecture - Presentation Layer
 *
 * Componente centralizado para manejar acciones sobre conductores.
 * Implementa validaciones de permisos y transiciones de estado.
 */

import { useCallback } from "react";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CircleCheck,
  Moon,
  CircleX,
} from "lucide-react";
import { usePermissions } from "@shared/permissions";
import { useAuth } from "@shared/auth";
import {
  DriverStatus,
  VALID_STATUS_TRANSITIONS,
  type DriverListItem,
  type Driver,
  type DriverStatusType,
} from "../../domain";

// ============================================================================
// TYPES
// ============================================================================

interface DriverActionsProps {
  driver: DriverListItem | Driver;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChangeStatus?: (id: string, status: DriverStatusType) => void;
  variant?: "dropdown" | "buttons";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DriverActions({
  driver,
  onView,
  onEdit,
  onDelete,
  onChangeStatus,
  variant = "dropdown",
}: DriverActionsProps) {
  const { hasPermission } = usePermissions();
  const { user } = useAuth();

  // Permisos
  const canView = hasPermission("drivers", "read");
  const canEdit = hasPermission("drivers", "update");
  const canDelete = hasPermission("drivers", "delete");
  const canChangeStatus = hasPermission("drivers", "update");

  // Acceso completo para roles admin/manager
  const hasFullAccess = ["admin", "manager"].includes(user?.role ?? "");

  // Transiciones de estado disponibles
  const availableTransitions = VALID_STATUS_TRANSITIONS[driver.status] || [];

  // Handlers
  const handleView = useCallback(() => {
    onView?.(driver.id);
  }, [driver.id, onView]);

  const handleEdit = useCallback(() => {
    onEdit?.(driver.id);
  }, [driver.id, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.(driver.id);
  }, [driver.id, onDelete]);

  const handleStatusChange = useCallback(
    (status: DriverStatusType) => {
      onChangeStatus?.(driver.id, status);
    },
    [driver.id, onChangeStatus],
  );

  // Renderizar como botones
  if (variant === "buttons") {
    return (
      <div className="flex items-center gap-2">
        {canView && onView && (
          <Button variant="outline" size="sm" onClick={handleView}>
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
        )}
        {canEdit && onEdit && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        )}
        {canDelete && onDelete && driver.status !== DriverStatus.ON_TRIP && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        )}
      </div>
    );
  }

  // Renderizar como dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Ver */}
        {canView && onView && (
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
        )}

        {/* Editar */}
        {canEdit && onEdit && (
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}

        {/* Cambios de estado */}
        {canChangeStatus &&
          onChangeStatus &&
          availableTransitions.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {availableTransitions.includes(DriverStatus.AVAILABLE) && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange(DriverStatus.AVAILABLE)}
                >
                  <CircleCheck className="mr-2 h-4 w-4 text-green-500" />
                  Marcar como disponible
                </DropdownMenuItem>
              )}
              {availableTransitions.includes(DriverStatus.RESTING) && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange(DriverStatus.RESTING)}
                >
                  <Moon className="mr-2 h-4 w-4 text-blue-500" />
                  Marcar en descanso
                </DropdownMenuItem>
              )}
              {availableTransitions.includes(DriverStatus.INACTIVE) && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange(DriverStatus.INACTIVE)}
                >
                  <CircleX className="mr-2 h-4 w-4 text-red-500" />
                  Marcar como inactivo
                </DropdownMenuItem>
              )}
            </>
          )}

        {/* Eliminar */}
        {canDelete && onDelete && driver.status !== DriverStatus.ON_TRIP && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
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
