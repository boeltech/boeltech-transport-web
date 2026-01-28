/**
 * AdminRoute
 *
 * Guard que permite acceso solo a administradores.
 * Es un shortcut para RoleRoute con role="admin".
 *
 * Ubicación: src/app/router/guards/AdminRoute.tsx
 *
 * @example
 * <AdminRoute>
 *   <AdminSettingsPage />
 * </AdminRoute>
 */

import { Navigate, Outlet } from "react-router-dom";
import { usePermissions } from "@/shared/permissions";

// ============================================
// Types
// ============================================

interface AdminRouteProps {
  /** Ruta a la que redirigir si no es admin */
  redirectTo?: string;
  /** Componente a mostrar mientras carga */
  fallback?: React.ReactNode;
}

// ============================================
// Component
// ============================================

export function AdminRoute({
  redirectTo = "/forbidden",
  fallback = null,
}: AdminRouteProps = {}) {
  const { hasRole, isLoading, isAuthenticated } = usePermissions();

  // Mientras carga, mostrar fallback
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar si es admin
  if (!hasRole("admin")) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
