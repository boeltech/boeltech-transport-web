import type { User } from "../model/types";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "erp_access_token",
  REFRESH_TOKEN: "erp_refresh_token",
  USER: "erp_user",
  SUBDOMAIN: "erp_subdomain",
} as const;

/**
 * Utilidad para manejar el almacenamiento de tokens y datos de sesión
 *
 * Usa localStorage para persistencia entre sesiones.
 * En producción, considera usar httpOnly cookies para mayor seguridad.
 */
export const tokenStorage = {
  // ============================================
  // Access Token
  // ============================================

  /**
   * Obtener el access token
   */
  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Guardar el access token
   */
  setToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  /**
   * Eliminar el access token
   */
  removeToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  // ============================================
  // Refresh Token
  // ============================================

  /**
   * Obtener el refresh token
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Guardar el refresh token
   */
  setRefreshToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  /**
   * Eliminar el refresh token
   */
  removeRefreshToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // ============================================
  // User
  // ============================================

  /**
   * Obtener los datos del usuario
   */
  getUser: (): User | null => {
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  },

  /**
   * Guardar los datos del usuario
   */
  setUser: (user: User): void => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  /**
   * Eliminar los datos del usuario
   */
  removeUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // ============================================
  // Subdomain
  // ============================================

  /**
   * Obtener el subdomain guardado (para recordar la empresa)
   */
  getSubdomain: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.SUBDOMAIN);
  },

  /**
   * Guardar el subdomain
   */
  setSubdomain: (subdomain: string): void => {
    localStorage.setItem(STORAGE_KEYS.SUBDOMAIN, subdomain);
  },

  /**
   * Eliminar el subdomain
   */
  removeSubdomain: (): void => {
    localStorage.removeItem(STORAGE_KEYS.SUBDOMAIN);
  },

  // ============================================
  // Utilidades
  // ============================================

  /**
   * Limpiar todos los datos de sesión
   */
  clear: (): void => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    // No limpiamos subdomain para recordar la empresa
  },

  /**
   * Verificar si hay una sesión activa (existe token)
   */
  hasSession: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
};
