/**
 * AnyModuleRoute
 *
 * Guard OR: permite acceso si el usuario tiene la acción (default `read`)
 * en al menos uno de los módulos listados.
 *
 * Uso: pantallas compartidas flota (p. ej. documentos por vencer) donde
 * basta `vehicles.read` o `drivers.read`.
 */

import { Navigate, Outlet } from "react-router-dom";
import { usePermissions, type Module, type Action } from "@/shared/permissions";

interface AnyModuleRouteProps {
  modules: Module[];
  action?: Action;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AnyModuleRoute({
  modules,
  action = "read",
  redirectTo = "/forbidden",
  fallback = null,
}: AnyModuleRouteProps) {
  const { hasPermission, isLoading, isAuthenticated } = usePermissions();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = modules.some((module) => hasPermission(module, action));

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
