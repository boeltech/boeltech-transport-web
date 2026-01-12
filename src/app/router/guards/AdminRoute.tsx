import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RoleRoute } from "./RoleRoute";
import { useAuth } from "@app/providers";

// ============================================
// AdminRoute - Solo administradores
// ============================================
interface AdminRouteProps {
  redirectTo?: string;
}

export const AdminRoute = ({ redirectTo = "/forbidden" }: AdminRouteProps) => {
  return <RoleRoute roles="admin" redirectTo={redirectTo} />;
};

// ============================================
// PrivateRoute - Solo autenticados (sin permisos específicos)
// ============================================
export const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};
