/**
 * Auth API
 * Clean Architecture - Infrastructure Layer
 *
 * Llamadas HTTP al backend de autenticación.
 *
 * Ubicación: src/features/auth/infrastructure/api/authApi.ts
 */

import {
  apiClient,
  mapActionResponse,
  mapSingleResponse,
  type ApiActionResponse,
  type ApiSingleResponse,
} from "@/shared/api";
import type {
  ApiEnvelope,
  AuthResponse,
  ChangePasswordPayload,
  LoginApiData,
  RefreshApiData,
  RefreshResponse,
  UpdateMyProfilePayload,
  UpdateProfileResult,
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
  onboardingCompletedAt:
    user.onboarding_completed_at !== undefined
      ? user.onboarding_completed_at
      : undefined,
});

/**
 * API de Autenticación
 *
 * Endpoints:
 * - POST /api/v1/auth/login    - Iniciar sesión
 * - POST /api/v1/auth/refresh  - Renovar token
 * - POST /api/v1/auth/logout   - Cerrar sesión
 * - GET   /api/v1/auth/profile  - Obtener perfil del usuario
 * - PATCH /api/v1/auth/profile  - Actualizar perfil (nombre, apellido, email)
 * - POST  /api/v1/auth/change-password - Cambiar contraseña (sesión activa)
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

  /**
   * Cambiar contraseña con sesión activa (revoca demás refresh tokens en servidor).
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    const raw = await apiClient.post<ApiActionResponse>(
      "/auth/change-password",
      {
        currentPassword: payload.currentPassword,
        password: payload.newPassword,
        confirmPassword: payload.confirmNewPassword,
      },
    );
    mapActionResponse(raw);
  },

  /**
   * Marca el onboarding de producto como completado (persistente en servidor).
   */
  completeProductOnboarding: async (): Promise<void> => {
    const raw = await apiClient.post<
      ApiSingleResponse<{ onboarding_completed_at: string }>
    >("/auth/complete-onboarding");
    mapSingleResponse(raw);
  },

  /**
   * Actualizar perfil del usuario autenticado (campos básicos de cuenta).
   * El body se envía en camelCase; el cliente serializa a snake_case.
   */
  updateProfile: async (
    payload: UpdateMyProfilePayload,
  ): Promise<UpdateProfileResult> => {
    const raw = await apiClient.patch<
      ApiSingleResponse<UserApi> & { access_token?: string }
    >("/auth/profile", payload);
    const { data } = mapSingleResponse(raw);
    const user: UserJSON = {
      id: data.id,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      tenant: {
        id: data.tenant.id,
        name: data.tenant.name,
        subdomain: data.tenant.subdomain,
      },
      lastLogin: data.lastLogin,
      permissions: data.permissions,
      onboardingCompletedAt: data.onboardingCompletedAt,
    };
    return {
      user,
      ...(raw.access_token ? { accessToken: raw.access_token } : {}),
    };
  },
};
