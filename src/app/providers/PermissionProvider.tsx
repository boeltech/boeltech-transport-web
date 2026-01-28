/**
 * PermissionProvider
 *
 * Provider que inicializa y expone el sistema de permisos RBAC.
 * Obtiene el rol del usuario desde AuthProvider y calcula los permisos.
 *
 * Ubicación: src/app/providers/PermissionProvider.tsx
 *
 * @example
 * // En tu App.tsx o providers
 * <QueryProvider>
 *   <AuthProvider>
 *     <PermissionProvider>
 *       <ThemeProvider>
 *         <App />
 *       </ThemeProvider>
 *     </PermissionProvider>
 *   </AuthProvider>
 * </QueryProvider>
 */

import { useMemo, useCallback, type ReactNode } from "react";
import { useAuth } from "@features/auth";
import {
  PermissionContext,
  type PermissionContextValue,
} from "@/shared/permissions/infrastructure";
import {
  type Role,
  type Module,
  type Action,
  type PermissionString,
  isAdminRole,
  createPermissionString,
  hasPermissionInList,
  checkAllPermissions,
  checkAnyPermission,
  hasRole as domainHasRole,
  hasAnyRole as domainHasAnyRole,
  getAvailableActions,
  getAccessibleModules,
  getPermissionsForRole,
  MODULES,
  ACTIONS,
} from "@/shared/permissions/domain";

// ============================================
// Props
// ============================================

interface PermissionProviderProps {
  children: ReactNode;
  /** Permisos custom adicionales */
  customPermissions?: PermissionString[];
  /** Permisos explícitamente denegados */
  deniedPermissions?: PermissionString[];
}

// ============================================
// Provider
// ============================================

export function PermissionProvider({
  children,
  customPermissions = [],
  deniedPermissions = [],
}: PermissionProviderProps) {
  // Obtener datos del usuario desde AuthProvider
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  // Extraer rol del usuario
  const role = useMemo<Role | null>(() => {
    if (!user?.role) return null;
    return user.role as Role;
  }, [user?.role]);

  // Calcular permisos del usuario
  const permissions = useMemo<PermissionString[]>(() => {
    if (!role) return [];

    // Obtener permisos base del rol
    const rolePermissions = getPermissionsForRole(role);

    // Combinar con permisos custom
    const combined = new Set([...rolePermissions, ...customPermissions]);

    // Remover permisos denegados
    deniedPermissions.forEach((p) => combined.delete(p));

    return Array.from(combined);
  }, [role, customPermissions, deniedPermissions]);

  // ==========================================
  // Permission Check Functions
  // ==========================================

  const hasPermission = useCallback(
    (module: Module, action: Action): boolean => {
      if (isAdminRole(role)) return true;

      const permission = createPermissionString(module, action);

      // Verificar si está denegado
      if (hasPermissionInList(permission, deniedPermissions)) {
        return false;
      }

      return hasPermissionInList(permission, permissions);
    },
    [role, permissions, deniedPermissions],
  );

  const can = useCallback(
    (permission: PermissionString): boolean => {
      if (isAdminRole(role)) return true;
      if (hasPermissionInList(permission, deniedPermissions)) return false;
      return hasPermissionInList(permission, permissions);
    },
    [role, permissions, deniedPermissions],
  );

  const canAll = useCallback(
    (required: PermissionString[]): boolean => {
      return checkAllPermissions(role, permissions, required);
    },
    [role, permissions],
  );

  const canAny = useCallback(
    (required: PermissionString[]): boolean => {
      return checkAnyPermission(role, permissions, required);
    },
    [role, permissions],
  );

  // ==========================================
  // Role Check Functions
  // ==========================================

  const hasRole = useCallback(
    (targetRole: Role): boolean => {
      return domainHasRole(role, targetRole);
    },
    [role],
  );

  const hasAnyRole = useCallback(
    (roles: Role[]): boolean => {
      return domainHasAnyRole(role, roles);
    },
    [role],
  );

  // ==========================================
  // Module Helpers
  // ==========================================

  const getModuleActions = useCallback(
    (module: Module): Action[] => {
      if (isAdminRole(role)) return [...ACTIONS];
      return getAvailableActions(role, module, permissions);
    },
    [role, permissions],
  );

  const getAccessibleModulesCallback = useCallback((): Module[] => {
    if (isAdminRole(role)) return [...MODULES];
    return getAccessibleModules(role, permissions);
  }, [role, permissions]);

  // ==========================================
  // Context Value
  // ==========================================

  const value = useMemo<PermissionContextValue>(
    () => ({
      // State
      role,
      permissions,
      isLoading: isAuthLoading,
      isAuthenticated,

      // Permission checks
      hasPermission,
      can,
      canAll,
      canAny,

      // Role checks
      hasRole,
      hasAnyRole,

      // Module helpers
      getModuleActions,
      getAccessibleModules: getAccessibleModulesCallback,
    }),
    [
      role,
      permissions,
      isAuthLoading,
      isAuthenticated,
      hasPermission,
      can,
      canAll,
      canAny,
      hasRole,
      hasAnyRole,
      getModuleActions,
      getAccessibleModulesCallback,
    ],
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
