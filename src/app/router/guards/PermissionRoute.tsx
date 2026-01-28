/**
 * PermissionRoute
 *
 * Guard que verifica si el usuario tiene un permiso específico.
 * Integrado con el sistema de permisos de @/shared/auth.
 *
 * Ubicación: src/app/router/guards/PermissionRoute.tsx
 *
 * @example
 * <PermissionRoute module="trips" action="create">
 *   <TripCreatePage />
 * </PermissionRoute>
 *
 * // O con permission string
 * <PermissionRoute permission="trips.create">
 *   <TripCreatePage />
 * </PermissionRoute>
 */

import { Navigate, Outlet } from "react-router-dom";
import {
  usePermissions,
  type Module,
  type Action,
  type PermissionString,
} from "@/shared/permissions";

// ============================================
// Types
// ============================================

interface PermissionRouteWithModuleAction {
  /** Módulo requerido */
  module: Module;
  /** Acción requerida */
  action: Action;
  permission?: never;
}

interface PermissionRouteWithString {
  /** Permiso en formato string (ej: "trips.create") */
  permission: PermissionString;
  module?: never;
  action?: never;
}

type PermissionRouteProps = (
  | PermissionRouteWithModuleAction
  | PermissionRouteWithString
) & {
  /** Ruta a la que redirigir si no tiene permiso */
  redirectTo?: string;
  /** Componente a mostrar mientras carga */
  fallback?: React.ReactNode;
};

// ============================================
// Component
// ============================================

export function PermissionRoute({
  module,
  action,
  permission,
  redirectTo = "/forbidden",
  fallback = null,
}: PermissionRouteProps) {
  const { hasPermission, can, isLoading, isAuthenticated } = usePermissions();

  // Mientras carga, mostrar fallback
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permiso
  let hasAccess = false;

  if (permission) {
    // Usar formato string
    hasAccess = can(permission);
  } else if (module && action) {
    // Usar módulo + acción
    hasAccess = hasPermission(module, action);
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
