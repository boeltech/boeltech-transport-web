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
  accessToken: string;
  refreshToken: string;
  user: UserJSON;
}

/**
 * Respuesta del endpoint POST /api/v1/auth/refresh
 */
export interface RefreshResponse {
  accessToken: string;
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
export interface IAuthRepository {
  login(credentials: {
    email: string;
    password: string;
    subdomain: string;
  }): Promise<AuthResponse>;
  logout(refreshToken?: string): Promise<void>;
  getProfile(): Promise<UserJSON>;
  refreshToken(refreshToken: string): Promise<RefreshResponse>;
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
