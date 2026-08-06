import type { PlatformUserJSON } from "../domain/entities";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "erp_platform_access_token",
  REFRESH_TOKEN: "erp_platform_refresh_token",
  USER: "erp_platform_user",
} as const;

const FRESH_LOGIN_KEY = "erp_platform_auth_fresh_login";

export function markPlatformFreshLoginSession(): void {
  sessionStorage.setItem(FRESH_LOGIN_KEY, "1");
}

export function consumePlatformFreshLoginSession(): boolean {
  const fresh = sessionStorage.getItem(FRESH_LOGIN_KEY) === "1";
  if (fresh) {
    sessionStorage.removeItem(FRESH_LOGIN_KEY);
  }
  return fresh;
}

export const platformTokenStorage = {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  removeToken(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  removeRefreshToken(): void {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getUser(): PlatformUserJSON | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PlatformUserJSON;
    } catch {
      return null;
    }
  },

  setUser(user: PlatformUserJSON): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  removeUser(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(FRESH_LOGIN_KEY);
  },

  /**
   * Sesión recoverable: access presente, o refresh+user (access se renueva vía /platform/auth/refresh).
   */
  hasSession(): boolean {
    if (localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
      return true;
    }
    return (
      !!localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) &&
      !!localStorage.getItem(STORAGE_KEYS.USER)
    );
  },
};
