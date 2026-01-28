/**
 * Auth Module - Public API
 * Feature-Sliced Design + Clean Architecture
 *
 * Sistema de autenticación y autorización (RBAC).
 *
 * Ubicación: src/shared/auth/index.ts
 *
 * ============================================================================
 * ESTRUCTURA:
 * ============================================================================
 *
 * src/shared/auth/
 * ├── domain/           → Entidades, reglas, matriz de permisos
 * ├── application/      → Casos de uso
 * ├── infrastructure/   → Context, hooks, guards
 * └── index.ts          → Public API
 *
 * src/app/providers/
 * └── PermissionProvider.tsx  → Provider de React
 *
 * ============================================================================
 * USO BÁSICO:
 * ============================================================================
 *
 * import { usePermissions, PermissionGuard, RoleGuard } from '@/shared/auth';
 *
 * // En componentes
 * const { hasPermission, hasRole } = usePermissions();
 * if (hasPermission('trips', 'create')) { ... }
 *
 * // Guards en JSX
 * <PermissionGuard module="trips" action="delete">
 *   <DeleteButton />
 * </PermissionGuard>
 *
 */

// ============================================================================
// DOMAIN - Types & Entities
// ============================================================================

export {
  // Constants
  MODULES,
  ACTIONS,
  ROLES,

  // Types
  type Module,
  type Action,
  type Role,
  type Permission,
  type PermissionString,
  type UserPermissions,
  type RoleDefinition,
  type PermissionCheckResult,
  type PermissionState,
} from "@shared/permissions/domain";

// ============================================================================
// DOMAIN - Business Rules
// ============================================================================

export {
  // Permission helpers
  createPermissionString,
  parsePermissionString,
  isValidPermission,
  isAdminRole,

  // Permission checks
  checkPermission,
  checkAllPermissions,
  checkAnyPermission,

  // Role helpers
  hasRole,
  hasAnyRole,
  getRoleHierarchy,
  isRoleAbove,

  // Module helpers
  getAvailableActions,
  getAccessibleModules,
} from "@shared/permissions/domain";

// ============================================================================
// DOMAIN - Role Permissions Matrix
// ============================================================================

export {
  ROLE_DEFINITIONS,
  getPermissionsForRole,
  getRoleDefinition,
  getRoleName,
  getRoleDescription,
  getAllRoles,
  getAssignableRoles,
} from "@shared/permissions/domain";

// ============================================================================
// APPLICATION - Use Cases
// ============================================================================

export {
  createCheckPermissionUseCase,
  createGetUserPermissionsUseCase,
  createCheckRoleUseCase,
  createCheckAnyRoleUseCase,
  createGetModuleActionsUseCase,
  createCheckMultiplePermissionsUseCase,
  createInitializePermissionStateUseCase,
} from "@shared/permissions/application";

// ============================================================================
// INFRASTRUCTURE - Context
// ============================================================================

export {
  PermissionContext,
  type PermissionContextValue,
} from "@shared/permissions/infrastructure";

// ============================================================================
// INFRASTRUCTURE - Hooks
// ============================================================================

export {
  usePermissions,
  useHasPermission,
  useHasRole,
  useCanAll,
  useCanAny,
  useRole,
  useIsAuthenticated,
  type UsePermissionsReturn,
} from "@shared/permissions/infrastructure";

// ============================================================================
// INFRASTRUCTURE - Guard Components
// ============================================================================

export {
  PermissionGuard,
  CanGuard,
  MultiPermissionGuard,
  RoleGuard,
  AdminGuard,
  AuthenticatedGuard,
} from "@shared/permissions/infrastructure";
