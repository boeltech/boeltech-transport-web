/**
 * Token Storage
 * Clean Architecture - Infrastructure Layer
 *
 * Almacenamiento de tokens y datos de autenticación en localStorage.
 *
 * Ubicación: src/features/auth/infrastructure/storage/tokenStorage.ts
 */

import type { ITokenStorage } from "../../domain";
import type { UserJSON } from "../../domain";

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: "erp_access_token",
  REFRESH_TOKEN: "erp_refresh_token",
  USER: "erp_user",
  SUBDOMAIN: "erp_subdomain",
} as const;

/** Tras login/register en LoginPage (fuera de AuthProvider): omitir spinner de verificación. */
const FRESH_LOGIN_KEY = "erp_auth_fresh_login";

export function markFreshLoginSession(): void {
  sessionStorage.setItem(FRESH_LOGIN_KEY, "1");
}

export function consumeFreshLoginSession(): boolean {
  const fresh = sessionStorage.getItem(FRESH_LOGIN_KEY) === "1";
  if (fresh) {
    sessionStorage.removeItem(FRESH_LOGIN_KEY);
  }
  return fresh;
}

// ============================================
// TOKEN STORAGE IMPLEMENTATION
// ============================================

/**
 * Implementación de ITokenStorage usando localStorage
 */
export const tokenStorage: ITokenStorage = {
  // ==========================================
  // Access Token
  // ==========================================

  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // ==========================================
  // Refresh Token
  // ==========================================

  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  removeRefreshToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // ==========================================
  // User
  // ==========================================

  getUser: (): UserJSON | null => {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as UserJSON;
    } catch {
      return null;
    }
  },

  setUser: (user: UserJSON): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // ==========================================
  // Subdomain
  // ==========================================

  getSubdomain: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.SUBDOMAIN);
  },

  setSubdomain: (subdomain: string): void => {
    localStorage.setItem(STORAGE_KEYS.SUBDOMAIN, subdomain);
  },

  // ==========================================
  // Utilities
  // ==========================================

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    // No limpiamos subdomain para recordar la empresa
  },

  hasSession: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
};
