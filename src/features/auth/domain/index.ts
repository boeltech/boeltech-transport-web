/**
 * Auth Domain - Public API
 * Clean Architecture - Domain Layer
 *
 * Ubicación: src/features/auth/domain/index.ts
 */

// Entities
export {
  User,
  Tenant,
  type UserData,
  type UserJSON,
  type TenantData,
} from "./entities";

// Value Objects
export { Token, Credentials, type LoginCredentials } from "./valueObjects";

// Types
export {
  type AuthResponse,
  type RefreshResponse,
  type ApiEnvelope,
  type LoginApiData,
  type RefreshApiData,
  type UserApi,
  type AuthState,
  type AuthErrorCode,
  type AuthError,
  AuthException,
  type IAuthRepository,
  type ITokenStorage,
  type UpdateMyProfilePayload,
  type UpdateProfileResult,
  type ChangePasswordPayload,
  type ChangePasswordResult,
} from "./types";
