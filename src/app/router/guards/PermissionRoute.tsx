import type { Permission } from "@features/permissions";
import { useAuth, usePermissions } from "@app/providers";
import { Navigate, Outlet, useLocation } from "react-router-dom";

// ============================================
// PermissionRoute - Protege rutas por permiso
// ============================================
interface PermissionRouteProps {
  /** Permiso requerido */
  permission?: Permission;

  /** Múltiples permisos (requiere TODOS) */
  permissions?: Permission[];

  /** Múltiples permisos (requiere AL MENOS UNO) */
  anyPermission?: Permission[];

  /** Ruta de redirección si no tiene permiso */
  redirectTo?: string;
}

export const PermissionRoute = ({
  permission,
  permissions,
  anyPermission,
  redirectTo = "/forbidden",
}: PermissionRouteProps) => {
  const { isAuthenticated } = useAuth();
  const { hasPermission, hasAllPermissions, hasAnyPermission } =
    usePermissions();
  const location = useLocation();

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Evaluar permisos
  let isAllowed = true;

  if (permission) {
    isAllowed = hasPermission(permission);
  }

  if (isAllowed && permissions && permissions.length > 0) {
    isAllowed = hasAllPermissions(permissions);
  }

  if (isAllowed && anyPermission && anyPermission.length > 0) {
    isAllowed = hasAnyPermission(anyPermission);
  }

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
