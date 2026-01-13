import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";

interface PermissionRouteProps {
  /** Permiso requerido (ej: "fleet:vehicles:write") */
  permission: string;

  /** Ruta a la que redirigir si no tiene permiso (default: /forbidden) */
  redirectTo?: string;
}

/**
 * PermissionRoute
 *
 * Guard que verifica si el usuario tiene un permiso específico.
 *
 * @example
 * <PermissionRoute permission="fleet:vehicles:write">
 *   <VehicleCreatePage />
 * </PermissionRoute>
 */
export const PermissionRoute = ({
  permission,
  redirectTo = "/forbidden",
}: PermissionRouteProps) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
