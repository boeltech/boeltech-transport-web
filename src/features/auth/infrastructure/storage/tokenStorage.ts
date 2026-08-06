/**
 * Token Storage
 * Clean Architecture - Infrastructure Layer
 *
 * Almacenamiento de tokens y datos de autenticación en localStorage.
 * En AUTH_SESSION_MODE=cookies no se persisten access/refresh tenant.
 *
 * Ubicación: src/features/auth/infrastructure/storage/tokenStorage.ts
 */

import type { ITokenStorage } from "../../domain";
import type { UserJSON } from "../../domain";
import { persistsAuthTokens } from "../sessionMode";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "erp_access_token",
  REFRESH_TOKEN: "erp_refresh_token",
  USER: "erp_user",
  SUBDOMAIN: "erp_subdomain",
} as const;

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

/** Limpia tokens tenant legado si el modo ya no los persiste. */
function purgePersistedTokensIfNeeded(): void {
  if (persistsAuthTokens()) return;
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

purgePersistedTokensIfNeeded();

export const tokenStorage: ITokenStorage = {
  getToken: (): string | null => {
    if (!persistsAuthTokens()) return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setToken: (token: string): void => {
    if (!persistsAuthTokens()) {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    if (!persistsAuthTokens()) return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: (token: string): void => {
    if (!persistsAuthTokens()) {
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  removeRefreshToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

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

  getSubdomain: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.SUBDOMAIN);
  },

  setSubdomain: (subdomain: string): void => {
    localStorage.setItem(STORAGE_KEYS.SUBDOMAIN, subdomain);
  },

  clear: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SUBDOMAIN);
  },

  /**
   * Optimistic session marker for routing only (PrivateRoute).
   * - bearer/dual: presence of access token in localStorage
   * - cookies: presence of `erp_user` (not proof of HttpOnly cookies)
   * AuthProvider must verify with the API before rendering sensitive UI.
   */
  hasSession: (): boolean => {
    if (persistsAuthTokens()) {
      return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
    return !!localStorage.getItem(STORAGE_KEYS.USER);
  },
};
