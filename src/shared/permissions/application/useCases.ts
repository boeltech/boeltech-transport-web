/**
 * Permission Use Cases
 * Clean Architecture - Application Layer
 *
 * Casos de uso para verificación de permisos.
 * Orquestan la lógica de negocio del dominio.
 *
 * Ubicación: src/shared/auth/application/useCases.ts
 */

import {
  type Role,
  type Module,
  type Action,
  type PermissionString,
  type PermissionCheckResult,
  type PermissionState,
} from "../domain/entities";
import {
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,
  hasRole as domainHasRole,
  hasAnyRole as domainHasAnyRole,
  getAvailableActions as domainGetAvailableActions,
  getAccessibleModules as domainGetAccessibleModules,
  //   createPermissionString,
  mergePermissions,
} from "../domain/rules";
import { getPermissionsForRole } from "../domain/rolePermissions";

// ============================================
// CHECK PERMISSION USE CASE
// ============================================

export interface CheckPermissionInput {
  role: Role | null;
  module: Module;
  action: Action;
  customPermissions?: PermissionString[];
  deniedPermissions?: PermissionString[];
}

export interface CheckPermissionUseCase {
  execute(input: CheckPermissionInput): PermissionCheckResult;
}

export function createCheckPermissionUseCase(): CheckPermissionUseCase {
  return {
    execute(input: CheckPermissionInput): PermissionCheckResult {
      const {
        role,
        module,
        action,
        customPermissions = [],
        deniedPermissions = [],
      } = input;

      // Obtener permisos del rol
      const rolePermissions = role ? getPermissionsForRole(role) : [];

      // Combinar con permisos custom
      const allPermissions = mergePermissions(
        rolePermissions,
        customPermissions,
        deniedPermissions,
      );

      // Verificar permiso
      return checkPermission(
        role,
        allPermissions,
        module,
        action,
        deniedPermissions,
      );
    },
  };
}

// ============================================
// GET USER PERMISSIONS USE CASE
// ============================================

export interface GetUserPermissionsInput {
  role: Role | null;
  customPermissions?: PermissionString[];
  deniedPermissions?: PermissionString[];
}

export interface GetUserPermissionsResult {
  permissions: PermissionString[];
  accessibleModules: Module[];
}

export interface GetUserPermissionsUseCase {
  execute(input: GetUserPermissionsInput): GetUserPermissionsResult;
}

export function createGetUserPermissionsUseCase(): GetUserPermissionsUseCase {
  return {
    execute(input: GetUserPermissionsInput): GetUserPermissionsResult {
      const { role, customPermissions = [], deniedPermissions = [] } = input;

      if (!role) {
        return { permissions: [], accessibleModules: [] };
      }

      // Obtener permisos del rol
      const rolePermissions = getPermissionsForRole(role);

      // Combinar permisos
      const permissions = mergePermissions(
        rolePermissions,
        customPermissions,
        deniedPermissions,
      );

      // Obtener módulos accesibles
      const accessibleModules = domainGetAccessibleModules(role, permissions);

      return { permissions, accessibleModules };
    },
  };
}

// ============================================
// CHECK ROLE USE CASE
// ============================================

export interface CheckRoleInput {
  userRole: Role | null;
  requiredRole: Role;
}

export interface CheckRoleUseCase {
  execute(input: CheckRoleInput): boolean;
}

export function createCheckRoleUseCase(): CheckRoleUseCase {
  return {
    execute(input: CheckRoleInput): boolean {
      return domainHasRole(input.userRole, input.requiredRole);
    },
  };
}

// ============================================
// CHECK ANY ROLE USE CASE
// ============================================

export interface CheckAnyRoleInput {
  userRole: Role | null;
  requiredRoles: Role[];
}

export interface CheckAnyRoleUseCase {
  execute(input: CheckAnyRoleInput): boolean;
}

export function createCheckAnyRoleUseCase(): CheckAnyRoleUseCase {
  return {
    execute(input: CheckAnyRoleInput): boolean {
      return domainHasAnyRole(input.userRole, input.requiredRoles);
    },
  };
}

// ============================================
// GET MODULE ACTIONS USE CASE
// ============================================

export interface GetModuleActionsInput {
  role: Role | null;
  module: Module;
  permissions: PermissionString[];
}

export interface GetModuleActionsUseCase {
  execute(input: GetModuleActionsInput): Action[];
}

export function createGetModuleActionsUseCase(): GetModuleActionsUseCase {
  return {
    execute(input: GetModuleActionsInput): Action[] {
      return domainGetAvailableActions(
        input.role,
        input.module,
        input.permissions,
      );
    },
  };
}

// ============================================
// CHECK MULTIPLE PERMISSIONS USE CASE
// ============================================

export interface CheckMultiplePermissionsInput {
  role: Role | null;
  permissions: PermissionString[];
  required: PermissionString[];
  mode: "all" | "any";
}

export interface CheckMultiplePermissionsUseCase {
  execute(input: CheckMultiplePermissionsInput): boolean;
}

export function createCheckMultiplePermissionsUseCase(): CheckMultiplePermissionsUseCase {
  return {
    execute(input: CheckMultiplePermissionsInput): boolean {
      const { role, permissions, required, mode } = input;

      if (mode === "all") {
        return checkAllPermissions(role, permissions, required);
      }
      return checkAnyPermission(role, permissions, required);
    },
  };
}

// ============================================
// INITIALIZE PERMISSION STATE USE CASE
// ============================================

export interface InitializePermissionStateInput {
  role: Role | null;
  isAuthenticated: boolean;
  customPermissions?: PermissionString[];
  deniedPermissions?: PermissionString[];
}

export interface InitializePermissionStateUseCase {
  execute(input: InitializePermissionStateInput): PermissionState;
}

export function createInitializePermissionStateUseCase(): InitializePermissionStateUseCase {
  return {
    execute(input: InitializePermissionStateInput): PermissionState {
      const {
        role,
        isAuthenticated,
        customPermissions = [],
        deniedPermissions = [],
      } = input;

      if (!isAuthenticated || !role) {
        return {
          role: null,
          permissions: [],
          isLoading: false,
          isAuthenticated: false,
        };
      }

      const rolePermissions = getPermissionsForRole(role);
      const permissions = mergePermissions(
        rolePermissions,
        customPermissions,
        deniedPermissions,
      );

      return {
        role,
        permissions,
        isLoading: false,
        isAuthenticated: true,
      };
    },
  };
}
