/**
 * Permissions Module - Barrel Export
 * Clean Architecture
 *
 * Export point único para todo el módulo de permisos.
 *
 * Ubicación: src/shared/auth/index.ts
 */

// ============================================================================
// Domain Layer Exports
// ============================================================================

export type {
  Module,
  Action,
  Permission,
  PermissionString,
  UserPermissions,
  RoleDefinition,
  PermissionCheckResult,
  PermissionState,
} from "./domain/entities";

export { MODULES, ACTIONS } from "./domain/entities";

export {
  createPermissionString,
  parsePermissionString,
  isValidPermission,
  isAdminRole,
  hasPermissionInList,
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,
  hasRole,
  hasAnyRole,
  getAvailableActions,
  getAccessibleModules,
  isModuleAccessible,
  mergePermissions,
} from "./domain/rules";

export {
  ROLE_DEFINITIONS,
  getPermissionsForRole,
  getRoleDefinition,
  getRoleName,
  getRoleDescription,
  getAllRoles,
  getAssignableRoles,
  isValidRole,
} from "./domain/rolePermissions";

export {
  FINANCE_SUMMARY_ROUTE_ROLES,
  canAccessFinanceSummaryRoute,
} from "./domain/financeSummaryAccess";

// ============================================================================
// Application Layer Exports
// ============================================================================

export {
  createCheckPermissionUseCase,
  createGetUserPermissionsUseCase,
  createCheckRoleUseCase,
  createCheckAnyRoleUseCase,
  createGetModuleActionsUseCase,
  createCheckMultiplePermissionsUseCase,
  createInitializePermissionStateUseCase,
} from "./application/useCases";

export type {
  CheckPermissionInput,
  CheckPermissionUseCase,
  GetUserPermissionsInput,
  GetUserPermissionsResult,
  GetUserPermissionsUseCase,
  CheckRoleInput,
  CheckRoleUseCase,
  CheckAnyRoleInput,
  CheckAnyRoleUseCase,
  GetModuleActionsInput,
  GetModuleActionsUseCase,
  CheckMultiplePermissionsInput,
  CheckMultiplePermissionsUseCase,
  InitializePermissionStateInput,
  InitializePermissionStateUseCase,
} from "./application/useCases";

export {
  usePermissions,
  useHasPermission,
  useHasRole,
  useCanAll,
  useCanAny,
  useRole,
  useIsAuthenticated,
} from "./application/usePermissions";

export type { UsePermissionsReturn } from "./application/usePermissions";

// ============================================================================
// Infrastructure Layer Exports
// ============================================================================

export { PermissionContext } from "./infrastructure/PermissionContext";
export type { PermissionContextValue } from "./infrastructure/PermissionContext";

// export { PermissionProvider } from "./infrastructure/PermissionProvider";

export {
  PermissionGuard,
  CanGuard,
  MultiPermissionGuard,
  RoleGuard,
  AdminGuard,
  AuthenticatedGuard,
} from "./infrastructure";
