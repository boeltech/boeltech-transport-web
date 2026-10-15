/**
 * DenyRolesRoute
 *
 * Guard que bloquea roles concretos (p. ej. portal driver en flota web)
 * sin quitar permisos del matrix — esos pueden seguir usándose en API/mobile.
 *
 * Ubicación: src/app/router/guards/DenyRolesRoute.tsx
 */

import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@/shared/permissions";
import type { UserRole } from "@shared/constants/roles";

interface DenyRolesRouteProps {
  /** Rol o roles denegados */
  roles: UserRole | UserRole[];
  /** Ruta a la que redirigir si el rol está denegado */
  redirectTo?: string;
  /** Componente a mostrar mientras carga */
  fallback?: React.ReactNode;
}

export function DenyRolesRoute({
  roles,
  redirectTo = "/forbidden",
  fallback = null,
}: DenyRolesRouteProps) {
  const { hasRole, hasAnyRole, isLoading, isAuthenticated } = usePermissions();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const rolesArray = Array.isArray(roles) ? roles : [roles];
  const isDenied =
    rolesArray.length === 1
      ? hasRole(rolesArray[0])
      : hasAnyRole(rolesArray);

  if (isDenied) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
