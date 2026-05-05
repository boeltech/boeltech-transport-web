/**
 * Permission Provider
 * Clean Architecture - Infrastructure Layer
 *
 * Provider del sistema de permisos que orquesta los casos de uso.
 * Se coloca en la jerarquía de providers del proyecto.
 *
 * Ubicación: src/shared/auth/infrastructure/PermissionProvider.tsx
 *
 * ORDEN DE PROVIDERS (importante mantener):
 * 1. QueryProvider
 * 2. AuthProvider
 * 3. PermissionProvider ← ESTE
 * 4. ThemeProvider
 * 5. ToastProvider
 * 6. SidebarProvider
 * 7. LayoutShell
 */

import { useMemo, type ReactNode } from "react";
import { useAuth } from "@features/auth";
import {
  PermissionContext,
  type PermissionContextValue,
} from "@shared/permissions/infrastructure";
import type { UserRole } from "@shared/constants/roles";
import type {
  Module,
  Action,
  PermissionString,
} from "@shared/permissions/domain";
import {
  createCheckPermissionUseCase,
  createGetUserPermissionsUseCase,
  createCheckRoleUseCase,
  createCheckAnyRoleUseCase,
  createGetModuleActionsUseCase,
  createCheckMultiplePermissionsUseCase,
  createInitializePermissionStateUseCase,
} from "@shared/permissions/application";
import { parsePermissionString } from "@shared/permissions";

// ============================================================================
// Props
// ============================================================================

interface PermissionProviderProps {
  children: ReactNode;
  /** Permisos adicionales custom (opcional) */
  customPermissions?: PermissionString[];
  /** Permisos explícitamente denegados (opcional) */
  deniedPermissions?: PermissionString[];
}

// ============================================================================
// Provider Component
// ============================================================================

export function PermissionProvider({
  children,
  customPermissions = [],
  deniedPermissions = [],
}: PermissionProviderProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Casos de uso
  const checkPermissionUseCase = useMemo(
    () => createCheckPermissionUseCase(),
    [],
  );
  const getUserPermissionsUseCase = useMemo(
    () => createGetUserPermissionsUseCase(),
    [],
  );
  const checkRoleUseCase = useMemo(() => createCheckRoleUseCase(), []);
  const checkAnyRoleUseCase = useMemo(() => createCheckAnyRoleUseCase(), []);
  const getModuleActionsUseCase = useMemo(
    () => createGetModuleActionsUseCase(),
    [],
  );
  const checkMultiplePermissionsUseCase = useMemo(
    () => createCheckMultiplePermissionsUseCase(),
    [],
  );
  const initializePermissionStateUseCase = useMemo(
    () => createInitializePermissionStateUseCase(),
    [],
  );

  // Estado de permisos
  const permissionState = useMemo(() => {
    const role = user?.role as UserRole | null;

    return initializePermissionStateUseCase.execute({
      role,
      isAuthenticated,
      customPermissions,
      deniedPermissions,
    });
  }, [
    user?.role,
    isAuthenticated,
    customPermissions,
    deniedPermissions,
    initializePermissionStateUseCase,
  ]);

  // ============================================================================
  // Context Value Implementation
  // ============================================================================

  const contextValue: PermissionContextValue = useMemo(
    () => ({
      // State
      role: permissionState.role,
      permissions: permissionState.permissions,
      isLoading: authLoading,
      isAuthenticated: permissionState.isAuthenticated,

      // Permission checks
      hasPermission: (module: Module, action: Action): boolean => {
        const result = checkPermissionUseCase.execute({
          role: permissionState.role,
          module,
          action,
          customPermissions,
          deniedPermissions,
        });
        return result.allowed;
      },

      can: (permission: PermissionString): boolean => {
        const { module, action } = parsePermissionString(permission);
        const result = checkPermissionUseCase.execute({
          role: permissionState.role,
          module,
          action,
          customPermissions,
          deniedPermissions,
        });
        return result.allowed;
      },

      canAll: (permissions: PermissionString[]): boolean => {
        return checkMultiplePermissionsUseCase.execute({
          role: permissionState.role,
          permissions: permissionState.permissions,
          required: permissions,
          mode: "all",
        });
      },

      canAny: (permissions: PermissionString[]): boolean => {
        return checkMultiplePermissionsUseCase.execute({
          role: permissionState.role,
          permissions: permissionState.permissions,
          required: permissions,
          mode: "any",
        });
      },

      // Role checks
      hasRole: (role: UserRole): boolean => {
        return checkRoleUseCase.execute({
          userRole: permissionState.role,
          requiredRole: role,
        });
      },

      hasAnyRole: (roles: UserRole[]): boolean => {
        return checkAnyRoleUseCase.execute({
          userRole: permissionState.role,
          requiredRoles: roles,
        });
      },

      // Module helpers
      getModuleActions: (module: Module): Action[] => {
        return getModuleActionsUseCase.execute({
          role: permissionState.role,
          module,
          permissions: permissionState.permissions,
        });
      },

      getAccessibleModules: (): Module[] => {
        const result = getUserPermissionsUseCase.execute({
          role: permissionState.role,
          customPermissions,
          deniedPermissions,
        });
        return result.accessibleModules;
      },
    }),
    [
      permissionState,
      authLoading,
      customPermissions,
      deniedPermissions,
      checkPermissionUseCase,
      checkRoleUseCase,
      checkAnyRoleUseCase,
      getModuleActionsUseCase,
      getUserPermissionsUseCase,
      checkMultiplePermissionsUseCase,
    ],
  );

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}
