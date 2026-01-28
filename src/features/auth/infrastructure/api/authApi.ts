/**
 * Auth API
 * Clean Architecture - Infrastructure Layer
 *
 * Llamadas HTTP al backend de autenticación.
 *
 * Ubicación: src/features/auth/infrastructure/api/authApi.ts
 */

import { apiClient } from "@/shared/api";
import type { AuthResponse, RefreshResponse, UserJSON } from "../../domain";

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
   */
  login: async (credentials: {
    email: string;
    password: string;
    subdomain: string;
  }): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>("/auth/login", credentials);
  },

  /**
   * Renovar token de acceso
   */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    return apiClient.post<RefreshResponse>("/auth/refresh", { refreshToken });
  },

  /**
   * Cerrar sesión
   */
  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post("/auth/logout", { refreshToken });
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: async (): Promise<UserJSON> => {
    return apiClient.get<UserJSON>("/auth/profile");
  },
};
