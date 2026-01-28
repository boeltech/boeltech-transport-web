/**
 * Auth Infrastructure - Public API
 * Clean Architecture - Infrastructure Layer
 *
 * Ubicación: src/features/auth/infrastructure/index.ts
 */

// Storage
export { tokenStorage } from "./storage/tokenStorage";

// API
export { authApi } from "./api/authApi";

// Repositories
export { AuthRepository } from "./repositories/AuthRepository";

// Interceptors
export {
  setupAuthInterceptor,
  type AuthInterceptorConfig,
} from "./interceptors/authInterceptor";

// Hooks
export {
  useAuth,
  useRequireAuth,
  useCurrentUser,
  useIsAuthenticated,
  useAuthLoading,
} from "./hooks";
