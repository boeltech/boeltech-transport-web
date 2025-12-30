// src/app/router/RoleRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { usePermissions } from '@/app/providers/PermissionsProvider';

/**
 * RoleRoute - Componente para proteger rutas según permisos y roles
 * Verifica autenticación + permisos antes de renderizar
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Componentes a renderizar si tiene permisos
 * @param {string} props.requiredPermission - Permiso requerido (ej: 'vehicles.read')
 * @param {string[]} props.requiredPermissions - Array de permisos (al menos uno)
 * @param {boolean} props.requireAll - Si true, requiere TODOS los permisos del array
 * @param {string} props.requiredRole - Rol específico requerido
 * @param {string[]} props.requiredRoles - Array de roles válidos
 * @param {string} props.fallbackPath - Ruta a redirigir si no tiene permisos (default: /unauthorized)
 */
export const RoleRoute = ({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  requiredRole,
  requiredRoles,
  fallbackPath = '/unauthorized',
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { can, canAny, canAll, hasRole, hasAnyRole } = usePermissions();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permiso único
  if (requiredPermission && !can(requiredPermission)) {
    console.warn(`Access denied: Missing permission '${requiredPermission}'`);
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar múltiples permisos
  if (requiredPermissions) {
    const hasPermission = requireAll
      ? canAll(requiredPermissions)
      : canAny(requiredPermissions);

    if (!hasPermission) {
      console.warn(
        `Access denied: Missing ${requireAll ? 'all' : 'any'} of permissions:`,
        requiredPermissions
      );
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Verificar rol único
  if (requiredRole && !hasRole(requiredRole)) {
    console.warn(`Access denied: Required role '${requiredRole}', user has '${user.role}'`);
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar múltiples roles
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    console.warn(
      `Access denied: Required one of roles:`,
      requiredRoles,
      `user has '${user.role}'`
    );
    return <Navigate to={fallbackPath} replace />;
  }

  // Si pasa todas las verificaciones, renderizar children
  return children;
};