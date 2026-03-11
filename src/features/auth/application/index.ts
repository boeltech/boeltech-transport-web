/**
 * Auth Application - Public API
 * Clean Architecture - Application Layer
 *
 * Ubicación: src/features/auth/application/index.ts
 */

// Hooks
export {
  useAuth,
  useRequireAuth,
  useCurrentUser,
  useAuthLoading,
  useIsAuthenticated,
} from "./hooks";

// Use Cases
export { LoginUseCase } from "./useCases/LoginUseCase";
export { LogoutUseCase } from "./useCases/LogoutUseCase";
export { VerifyAuthUseCase } from "./useCases/VerifyAuthUseCase";
export { RefreshTokenUseCase } from "./useCases/RefreshTokenUseCase";
export type { LoginUseCaseResult } from "./useCases/LoginUseCase";
