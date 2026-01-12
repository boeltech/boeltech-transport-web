import { useAuth, usePermissions } from "@app/providers";
import type { Module } from "@features/permissions";
import { Navigate, Outlet, useLocation } from "react-router-dom";

// ============================================
// ModuleRoute - Protege rutas por módulo
// ============================================
interface ModuleRouteProps {
  module: Module;
  redirectTo?: string;
}

export const ModuleRoute = ({
  module,
  redirectTo = "/forbidden",
}: ModuleRouteProps) => {
  const { isAuthenticated } = useAuth();
  const { hasModuleAccess } = usePermissions();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasModuleAccess(module)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};
