/**
 * Permission Domain - Public API
 * Clean Architecture - Domain Layer
 *
 * Ubicación: src/shared/auth/domain/index.ts
 */

// Entities & Types
export {
  MODULES,
  ACTIONS,
  ROLES,
  type Module,
  type Action,
  type Role,
  type Permission,
  type PermissionString,
  type UserPermissions,
  type RoleDefinition,
  type PermissionCheckResult,
  type PermissionState,
} from "./entities";

// Business Rules
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
  getRoleHierarchy,
  isRoleAbove,
  getAvailableActions,
  getAccessibleModules,
  mergePermissions,
  resolveRolePermissions,
} from "./rules";

// Role Permissions Matrix
export {
  ROLE_DEFINITIONS,
  getPermissionsForRole,
  getRoleDefinition,
  getRoleName,
  getRoleDescription,
  getAllRoles,
  getAssignableRoles,
} from "./rolePermissions";
