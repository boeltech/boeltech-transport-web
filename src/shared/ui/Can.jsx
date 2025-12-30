import { usePermissions } from '@app/providers/PermissionsProvider';

/**
 * Componente para mostrar contenido condicionalmente basado en permisos
 * 
 * Ejemplos de uso:
 * <Can permission="vehicles.create">
 *   <Button>Crear Vehículo</Button>
 * </Can>
 * 
 * <Can permissions={['trips.create', 'trips.update']} requireAll>
 *   <Button>Editar Viaje</Button>
 * </Can>
 * 
 * <Can role="administrador">
 *   <AdminPanel />
 * </Can>
 */

export const Can = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  fallback = null,
}) => {
  const { can, canAny, canAll, hasRole, hasAnyRole } = usePermissions();

  // Check single permission
  if (permission && !can(permission)) {
    return fallback;
  }

  // Check multiple permissions
  if (permissions) {
    const hasPermission = requireAll
      ? canAll(permissions)
      : canAny(permissions);

    if (!hasPermission) {
      return fallback;
    }
  }

  // Check single role
  if (role && !hasRole(role)) {
    return fallback;
  }

  // Check multiple roles
  if (roles && !hasAnyRole(roles)) {
    return fallback;
  }

  return children;
};