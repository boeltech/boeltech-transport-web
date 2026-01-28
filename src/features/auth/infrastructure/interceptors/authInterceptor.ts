/**
 * Auth Interceptor
 * Clean Architecture - Infrastructure Layer
 *
 * Interceptores de Axios para autenticación.
 *
 * Ubicación: src/features/auth/infrastructure/interceptors/authInterceptor.ts
 */

import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { tokenStorage } from "../storage/tokenStorage";

// ============================================
// TYPES
// ============================================

/**
 * Configuración del interceptor de autenticación
 */
export interface AuthInterceptorConfig {
  /** Callback cuando se recibe un 401 Unauthorized */
  onUnauthorized: () => void;
  /** Callback cuando se recibe un 403 Forbidden */
  onForbidden: () => void;
  /** Callback cuando se refresca el token exitosamente */
  onTokenRefreshed?: (newToken: string) => void;
}

// ============================================
// INTERCEPTOR
// ============================================

/**
 * Configurar interceptores de autenticación en Axios
 *
 * Responsabilidades:
 * 1. Añadir el token JWT a todas las peticiones
 * 2. Manejar errores 401 (token expirado) → intentar refresh
 * 3. Manejar errores 403 (sin permisos) → redirigir
 */
export function setupAuthInterceptor(
  apiClient: AxiosInstance,
  config: AuthInterceptorConfig,
): void {
  // ==========================================
  // Request Interceptor
  // ==========================================
  apiClient.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getToken();

      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      return requestConfig;
    },
    (error) => Promise.reject(error),
  );

  // ==========================================
  // Response Interceptor
  // ==========================================
  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // ==========================================
      // 401 Unauthorized - Token expirado
      // ==========================================
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          console.log(
            "[AuthInterceptor] 401 received, attempting token refresh...",
          );

          const refreshToken = tokenStorage.getRefreshToken();

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          // Intentar refrescar el token
          const response = await apiClient.post("/auth/refresh", {
            refreshToken,
          });

          const newToken = response.data.accessToken;

          // Guardar el nuevo token
          tokenStorage.setToken(newToken);
          console.log("[AuthInterceptor] Token refreshed successfully");

          // Notificar al provider
          config.onTokenRefreshed?.(newToken);

          // Reintentar la petición original
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error(
            "[AuthInterceptor] Token refresh failed:",
            refreshError,
          );
          config.onUnauthorized();
          return Promise.reject(refreshError);
        }
      }

      // ==========================================
      // 403 Forbidden - Sin permisos
      // ==========================================
      if (error.response?.status === 403) {
        console.log("[AuthInterceptor] 403 Forbidden received");
        config.onForbidden();
      }

      return Promise.reject(error);
    },
  );

  console.log("[AuthInterceptor] Interceptors configured successfully");
}
