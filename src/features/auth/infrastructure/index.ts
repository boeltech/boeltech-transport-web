/**
 * Auth Infrastructure - Public API
 * Clean Architecture - Infrastructure Layer
 *
 * Ubicación: src/features/auth/infrastructure/index.ts
 */

// Storage
export {
  tokenStorage,
  markFreshLoginSession,
  consumeFreshLoginSession,
} from "./storage/tokenStorage";

// API
export { authApi } from "./api/authApi";

// Repositories
export { AuthRepository } from "./repositories/AuthRepository";

// Interceptors
export {
  setupAuthInterceptor,
  type AuthInterceptorConfig,
} from "./interceptors/authInterceptor";

export {
  setTenantUnauthorizedHandler,
  notifyTenantUnauthorized,
  setTenantTokenRefreshedHandler,
  notifyTenantTokenRefreshed,
} from "./sessionHandlers";

// Hooks
export {
  useAuth,
  useRequireAuth,
  useCurrentUser,
  useIsAuthenticated,
  useAuthLoading,
  useUpdateMyProfile,
  useChangePassword,
} from "../application/hooks";
