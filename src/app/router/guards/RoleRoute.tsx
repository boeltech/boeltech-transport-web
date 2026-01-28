/**
 * RoleRoute
 *
 * Guard que verifica si el usuario tiene uno de los roles especificados.
 * Integrado con el sistema de permisos de @/shared/auth.
 *
 * Ubicación: src/app/router/guards/RoleRoute.tsx
 *
 * @example
 * <RoleRoute roles={['admin', 'manager']}>
 *   <ManagementPage />
 * </RoleRoute>
 *
 * // Un solo rol
 * <RoleRoute roles="admin">
 *   <AdminPage />
 * </RoleRoute>
 */

import { Navigate, Outlet } from "react-router-dom";
import { usePermissions, type Role } from "@/shared/permissions";

// ============================================
// Types
// ============================================

interface RoleRouteProps {
  /** Rol o roles permitidos */
  roles: Role | Role[];
  /** Ruta a la que redirigir si no tiene el rol */
  redirectTo?: string;
  /** Componente a mostrar mientras carga */
  fallback?: React.ReactNode;
}

// ============================================
// Component
// ============================================

export function RoleRoute({
  roles,
  redirectTo = "/forbidden",
  fallback = null,
}: RoleRouteProps) {
  const { hasRole, hasAnyRole, isLoading, isAuthenticated } = usePermissions();

  // Mientras carga, mostrar fallback
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar rol(es)
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  const hasAccess =
    rolesArray.length === 1 ? hasRole(rolesArray[0]) : hasAnyRole(rolesArray);

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
