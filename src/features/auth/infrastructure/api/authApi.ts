/**
 * Auth API
 * Clean Architecture - Infrastructure Layer
 *
 * Llamadas HTTP al backend de autenticación.
 *
 * Ubicación: src/features/auth/infrastructure/api/authApi.ts
 */

import { apiClient } from "@/shared/api";
import type {
  ApiEnvelope,
  AuthResponse,
  LoginApiData,
  RefreshApiData,
  RefreshResponse,
  UserApi,
  UserJSON,
} from "../../domain";

const mapUserApiToJson = (user: UserApi): UserJSON => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  role: user.role,
  tenant: user.tenant,
  lastLogin: user.last_login,
  permissions: user.permissions,
});

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
    const response = await apiClient.post<ApiEnvelope<LoginApiData>>(
      "/auth/login",
      credentials,
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      user: mapUserApiToJson(response.data.user),
    };
  },

  /**
   * Renovar token de acceso
   */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await apiClient.post<ApiEnvelope<RefreshApiData>>(
      "/auth/refresh",
      { refreshToken },
    );

    return {
      accessToken: response.data.access_token,
    };
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
    const response = await apiClient.get<ApiEnvelope<UserApi>>("/auth/profile");
    return mapUserApiToJson(response.data);
  },
};
