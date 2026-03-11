/**
 * Permission Infrastructure - Public API
 * Clean Architecture - Infrastructure Layer
 *
 * Ubicación: src/shared/auth/infrastructure/index.ts
 */

// Context
export {
  PermissionContext,
  type PermissionContextValue,
} from "./PermissionContext";

// Guards
export {
  PermissionGuard,
  CanGuard,
  MultiPermissionGuard,
  RoleGuard,
  AdminGuard,
  AuthenticatedGuard,
} from "./guards";
