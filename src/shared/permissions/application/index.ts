/**
 * Permission Application - Public API
 * Clean Architecture - Application Layer
 *
 * Ubicación: src/shared/auth/application/index.ts
 */

export {
  // Check Permission
  type CheckPermissionInput,
  type CheckPermissionUseCase,
  createCheckPermissionUseCase,

  // Get User Permissions
  type GetUserPermissionsInput,
  type GetUserPermissionsResult,
  type GetUserPermissionsUseCase,
  createGetUserPermissionsUseCase,

  // Check Role
  type CheckRoleInput,
  type CheckRoleUseCase,
  createCheckRoleUseCase,

  // Check Any Role
  type CheckAnyRoleInput,
  type CheckAnyRoleUseCase,
  createCheckAnyRoleUseCase,

  // Get Module Actions
  type GetModuleActionsInput,
  type GetModuleActionsUseCase,
  createGetModuleActionsUseCase,

  // Check Multiple Permissions
  type CheckMultiplePermissionsInput,
  type CheckMultiplePermissionsUseCase,
  createCheckMultiplePermissionsUseCase,

  // Initialize Permission State
  type InitializePermissionStateInput,
  type InitializePermissionStateUseCase,
  createInitializePermissionStateUseCase,
} from "./useCases";
