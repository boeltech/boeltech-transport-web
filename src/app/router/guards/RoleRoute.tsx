import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";

interface RoleRouteProps {
  /** Rol o roles permitidos */
  roles: string | string[];

  /** Ruta a la que redirigir si no tiene el rol (default: /forbidden) */
  redirectTo?: string;
}

/**
 * RoleRoute
 *
 * Guard que verifica si el usuario tiene uno de los roles especificados.
 *
 * @example
 * <RoleRoute roles={['admin', 'gerente']}>
 *   <ManagementPage />
 * </RoleRoute>
 */
export const RoleRoute = ({
  roles,
  redirectTo = "/forbidden",
}: RoleRouteProps) => {
  const { user, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(roles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
