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
  type MfaChallengeResponse,
  type LoginResult,
  isMfaChallenge,
  type RefreshResponse,
  type ApiEnvelope,
  type LoginApiData,
  type LoginMfaChallengeApiData,
  type LoginApiPayload,
  type RefreshApiData,
  type UserApi,
  type MfaStatus,
  type MfaSetupResult,
  type AuthSessionItem,
  type AuthState,
  type AuthErrorCode,
  type AuthError,
  AuthException,
  type IAuthRepository,
  type ITokenStorage,
  type UpdateMyProfilePayload,
  type UpdateProfileResult,
  type RequestEmailChangePayload,
  type EmailChangePendingResult,
  type ChangePasswordPayload,
  type ChangePasswordResult,
} from "./types";

/** Query key compartida MFA (tab Seguridad + tarjeta Datos). */
export const MFA_STATUS_QUERY_KEY = ["auth", "mfa-status"] as const;
