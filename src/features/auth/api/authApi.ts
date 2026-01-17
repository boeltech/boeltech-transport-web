import { apiClient } from "@shared/api";
import type { LoginCredentials, AuthResponse, User } from "../model/types";

/**
 * API de Autenticación
 *
 * Endpoints:
 * - POST /api/v1/auth/login    - Iniciar sesión
 * - POST /api/v1/auth/refresh  - Renovar token
 * - POST /api/v1/auth/logout   - Cerrar sesión
 * - GET  /api/v1/auth/profile  - Obtener perfil del usuario
 */
export const authApi = {
  /**
   * Iniciar sesión
   *
   * @param credentials - Email, password y subdomain
   * @returns Token de acceso, refresh token y datos del usuario
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // apiClient.post ya retorna response.data
    return apiClient.post<AuthResponse>("/auth/login", {
      email: credentials.email,
      password: credentials.password,
      subdomain: credentials.subdomain,
    });
  },

  /**
   * Renovar token de acceso
   *
   * @param refreshToken - Token de refresco
   * @returns Nuevo token de acceso
   */
  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    return apiClient.post<{ accessToken: string }>("/auth/refresh", {
      refreshToken,
    });
  },

  /**
   * Cerrar sesión
   *
   * @param refreshToken - Token de refresco a invalidar
   */
  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post("/auth/logout", { refreshToken });
  },

  /**
   * Obtener perfil del usuario autenticado
   *
   * @returns Datos del usuario
   */
  getProfile: async (): Promise<User> => {
    return apiClient.get<User>("/auth/profile");
  },

  /**
   * Alias para getProfile (compatibilidad con el nombre "me")
   */
  me: async (): Promise<User> => {
    return authApi.getProfile();
  },
};
