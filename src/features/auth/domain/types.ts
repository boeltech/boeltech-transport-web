/**
 * Auth Domain - Types
 * Clean Architecture - Domain Layer
 *
 * Tipos e interfaces del dominio de autenticación.
 *
 * Ubicación: src/features/auth/domain/types.ts
 */

import type { User, UserJSON } from "./entities";

// ============================================
// API TYPES
// ============================================

/**
 * Respuesta del endpoint POST /api/v1/auth/login
 */
export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  user: UserJSON;
}

/** Challenge MFA tras credenciales OK (sin tokens de sesión aún). */
export interface MfaChallengeResponse {
  needsMfa: true;
  mfaChallengeToken: string;
  mfaChallengeExpiresAt: string;
}

export type LoginResult = AuthResponse | MfaChallengeResponse;

export function isMfaChallenge(
  result: LoginResult,
): result is MfaChallengeResponse {
  return "needsMfa" in result && result.needsMfa === true;
}

/**
 * Respuesta del endpoint POST /api/v1/auth/refresh
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface ApiEnvelope<T> {
  message?: string;
  data: T;
}

export interface UserApi {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserJSON["role"];
  tenant: {
    id: string;
    name: string;
    subdomain: string;
  };
  last_login?: string;
  permissions?: string[];
  onboarding_completed_at?: string | null;
  email_verified_at?: string | null;
}

export interface LoginApiData {
  access_token?: string;
  refresh_token?: string;
  user: UserApi;
}

export interface LoginMfaChallengeApiData {
  needs_mfa: true;
  mfa_challenge_token: string;
  mfa_challenge_expires_at: string;
}

export type LoginApiPayload = LoginApiData | LoginMfaChallengeApiData;

export interface RefreshApiData {
  access_token: string;
  refresh_token?: string;
}

export interface MfaStatus {
  enabled: boolean;
  enabledAt: string | null;
}

export interface MfaSetupResult {
  otpauthUrl: string;
  secret: string;
}

export interface AuthSessionItem {
  id: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  userAgent: string | null;
  ip: string | null;
  label: string | null;
  current: boolean;
}

// ============================================
// STATE TYPES
// ============================================

/**
 * Estado de autenticación en el contexto
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// ERROR TYPES
// ============================================

/**
 * Códigos de error de autenticación
 */
export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "USER_INACTIVE"
  | "ACCOUNT_LOCKED"
  | "RATE_LIMIT_EXCEEDED"
  | "EMAIL_NOT_VERIFIED"
  | "CAPTCHA_REQUIRED"
  | "CAPTCHA_INVALID"
  | "TENANT_NOT_FOUND"
  | "TENANT_SUSPENDED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "NETWORK_ERROR"
  | "SERVER_ERROR";

/**
 * Error de autenticación
 */
export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

/**
 * Excepción de autenticación
 */
export class AuthException extends Error {
  public readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "AuthException";
  }
}

// ============================================
// REPOSITORY INTERFACES
// ============================================

/**
 * Interface del repositorio de autenticación
 */
/** Payload para actualizar el perfil del usuario autenticado (PATCH /auth/profile). */
export interface UpdateMyProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
}

/** Respuesta de PATCH /auth/profile: usuario + access token opcional (claims renovados). */
export interface UpdateProfileResult {
  user: UserJSON;
  accessToken?: string;
}

/** Cambio de contraseña con sesión activa (POST /auth/change-password). */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** Respuesta con nuevos tokens tras cambiar contraseña (versión de sesión renovada en servidor). */
export interface ChangePasswordResult {
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface IAuthRepository {
  login(credentials: {
    email: string;
    password: string;
    subdomain: string;
  }): Promise<LoginResult>;
  logout(refreshToken?: string): Promise<void>;
  getProfile(): Promise<UserJSON>;
  updateProfile(payload: UpdateMyProfilePayload): Promise<UpdateProfileResult>;
  changePassword(payload: ChangePasswordPayload): Promise<ChangePasswordResult>;
  refreshToken(refreshToken: string): Promise<RefreshResponse>;
  completeProductOnboarding(): Promise<void>;
}

/**
 * Interface del almacenamiento de tokens
 */
export interface ITokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  removeToken(): void;
  getRefreshToken(): string | null;
  setRefreshToken(token: string): void;
  removeRefreshToken(): void;
  getUser(): UserJSON | null;
  setUser(user: UserJSON): void;
  removeUser(): void;
  getSubdomain(): string | null;
  setSubdomain(subdomain: string): void;
  clear(): void;
  hasSession(): boolean;
}
