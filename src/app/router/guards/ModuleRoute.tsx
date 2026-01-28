/**
 * ModuleRoute
 *
 * Guard que verifica si el usuario tiene acceso a un módulo específico.
 * Verifica el permiso de lectura (read) por defecto.
 *
 * Integrado con el sistema de permisos de @/shared/auth.
 *
 * Ubicación: src/app/router/guards/ModuleRoute.tsx
 *
 * @example
 * <ModuleRoute module="trips">
 *   <TripsListPage />
 * </ModuleRoute>
 *
 * // Con acción específica
 * <ModuleRoute module="trips" action="create">
 *   <TripCreatePage />
 * </ModuleRoute>
 */

import { Navigate, Outlet } from "react-router-dom";
import { usePermissions, type Module, type Action } from "@/shared/permissions";

// ============================================
// Types
// ============================================

interface ModuleRouteProps {
  /** Módulo requerido */
  module: Module;
  /** Acción requerida (default: 'read') */
  action?: Action;
  /** Ruta a la que redirigir si no tiene acceso */
  redirectTo?: string;
  /** Componente a mostrar mientras carga */
  fallback?: React.ReactNode;
}

// ============================================
// Component
// ============================================

export function ModuleRoute({
  module,
  action = "read",
  redirectTo = "/forbidden",
  fallback = null,
}: ModuleRouteProps) {
  const { hasPermission, isLoading, isAuthenticated } = usePermissions();

  // Mientras carga, mostrar fallback
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar acceso al módulo
  const hasAccess = hasPermission(module, action);

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
