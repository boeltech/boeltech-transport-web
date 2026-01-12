import type { UserRole } from "@features/permissions";
import { useAuth, usePermissions } from "@app/providers";
import { Navigate, Outlet, useLocation } from "react-router-dom";

// ============================================
// RoleRoute - Protege rutas por rol
// ============================================
interface RoleRouteProps {
  roles: UserRole | UserRole[];
  redirectTo?: string;
}

export const RoleRoute = ({
  roles,
  redirectTo = "/forbidden",
}: RoleRouteProps) => {
  const { isAuthenticated } = useAuth();
  const { hasRole } = usePermissions();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasRole(roles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
