/**
 * Auth Interceptor
 * Clean Architecture - Infrastructure Layer
 *
 * Interceptores de Axios para autenticación.
 *
 * Ubicación: src/features/auth/infrastructure/interceptors/authInterceptor.ts
 */

import {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios";
import { tokenStorage } from "../storage/tokenStorage";
import { platformTokenStorage } from "@features/platform/infrastructure/platformTokenStorage";
import { notifyPlatformUnauthorized } from "@features/platform/infrastructure/platformSessionHandlers";

// ============================================
// TYPES
// ============================================

/**
 * Configuración del interceptor de autenticación
 */
export interface AuthInterceptorConfig {
  /** Callback cuando la sesión ya no es válida (refresh fallido, 401 definitivo, etc.) */
  onUnauthorized: () => void;
  /** Callback cuando se recibe un 403 Forbidden */
  onForbidden: () => void;
  /** Callback cuando se refresca el token exitosamente */
  onTokenRefreshed?: (newToken: string) => void;
}

// ============================================
// Estado compartido (solo entre peticiones en la misma pestaña)
// ============================================

let isRefreshing = false;

type PendingRetry = {
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig & { _retry?: boolean };
};

const pendingRetries: PendingRetry[] = [];

function setBearerToken(
  config: InternalAxiosRequestConfig,
  accessToken: string,
): void {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  config.headers = headers;
}

function rejectPending(error: unknown): void {
  pendingRetries.forEach(({ reject }) => reject(error));
  pendingRetries.length = 0;
}

function replayPending(instance: AxiosInstance, accessToken: string): void {
  pendingRetries.forEach(({ resolve, reject, config }) => {
    setBearerToken(config, accessToken);
    instance(config).then(resolve).catch(reject);
  });
  pendingRetries.length = 0;
}

function resolveAuthScope(
  requestConfig: InternalAxiosRequestConfig,
): "platform" | "tenant" {
  if (requestConfig.authScope === "platform") return "platform";
  if (requestConfig.authScope === "tenant") return "tenant";
  const url = requestConfig.url ?? "";
  if (url.includes("/platform/")) return "platform";
  return "tenant";
}

function getTokenStorage(scope: "platform" | "tenant") {
  return scope === "platform" ? platformTokenStorage : tokenStorage;
}

function isRefreshRequest(
  requestConfig: InternalAxiosRequestConfig,
  scope: "platform" | "tenant",
): boolean {
  const url = requestConfig.url ?? "";
  if (scope === "platform") {
    return url.includes("/platform/auth/refresh");
  }
  return url.includes("/auth/refresh");
}

/** Rutas de auth que no deben enviar Bearer (evita adjuntar JWT expirado innecesariamente). */
function isPublicAuthPath(requestConfig: InternalAxiosRequestConfig): boolean {
  const url = requestConfig.url ?? "";
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password") ||
    url.includes("/auth/verify-reset-token") ||
    url.includes("/platform/auth/login") ||
    url.includes("/platform/auth/refresh")
  );
}

async function refreshAccessToken(
  instance: AxiosInstance,
  scope: "platform" | "tenant",
): Promise<string> {
  const storage = getTokenStorage(scope);
  const refreshToken = storage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const endpoint =
    scope === "platform" ? "/platform/auth/refresh" : "/auth/refresh";

  const response = await instance.post(endpoint, {
    refresh_token: refreshToken,
  });

  const newToken = response?.data?.data?.access_token as string | undefined;

  if (!newToken) {
    throw new Error("Refresh response missing access_token");
  }

  storage.setToken(newToken);
  return newToken;
}

// ============================================
// INTERCEPTOR
// ============================================

/**
 * Configurar interceptores de autenticación en Axios.
 *
 * Responsabilidades:
 * 1. Adjuntar JWT salvo en rutas públicas de `/auth/*`.
 * 2. Ante 401: un solo refresh en paralelo y reintento de peticiones encoladas.
 * 3. Si el refresh falla o sigue 401 después de reintento → `onUnauthorized`.
 *
 * @returns función para ejectar interceptores (evitar duplicados si el effect se re-ejecuta).
 */
export function setupAuthInterceptor(
  axiosInstance: AxiosInstance,
  config: AuthInterceptorConfig,
): () => void {
  const requestInterceptorId = axiosInstance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      const scope = resolveAuthScope(requestConfig);
      const storage = getTokenStorage(scope);
      const token = storage.getToken();

      if (token && !isPublicAuthPath(requestConfig)) {
        setBearerToken(requestConfig, token);
      }

      return requestConfig;
    },
    (error) => Promise.reject(error),
  );

  const responseInterceptorId = axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined;

      if (error.response?.status === 403) {
        console.log("[AuthInterceptor] 403 Forbidden received");
        config.onForbidden();
        return Promise.reject(error);
      }

      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      if (!originalRequest) {
        config.onUnauthorized();
        return Promise.reject(error);
      }

      const scope = resolveAuthScope(originalRequest);

      if (isRefreshRequest(originalRequest, scope)) {
        console.error(
          "[AuthInterceptor] Refresh endpoint returned 401 — ending session",
        );
        if (scope === "platform") {
          platformTokenStorage.clear();
          notifyPlatformUnauthorized();
        } else {
          config.onUnauthorized();
        }
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        console.error(
          "[AuthInterceptor] 401 after retry — refresh did not fix access",
        );
        if (scope === "platform") {
          platformTokenStorage.clear();
          notifyPlatformUnauthorized();
        } else {
          config.onUnauthorized();
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRetries.push({
            resolve,
            reject,
            config: originalRequest,
          });
        });
      }

      isRefreshing = true;

      try {
        console.log("[AuthInterceptor] 401 received, attempting token refresh...");
        const newToken = await refreshAccessToken(axiosInstance, scope);
        console.log("[AuthInterceptor] Token refreshed successfully");
        if (scope === "tenant") {
          config.onTokenRefreshed?.(newToken);
        }

        replayPending(axiosInstance, newToken);

        setBearerToken(originalRequest, newToken);
        return await axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("[AuthInterceptor] Token refresh failed:", refreshError);
        rejectPending(refreshError);
        if (scope === "platform") {
          platformTokenStorage.clear();
          notifyPlatformUnauthorized();
        } else {
          config.onUnauthorized();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  console.log("[AuthInterceptor] Interceptors configured successfully");

  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptorId);
    axiosInstance.interceptors.response.eject(responseInterceptorId);
  };
}
