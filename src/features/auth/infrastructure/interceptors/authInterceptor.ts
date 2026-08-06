/**
 * Auth Interceptor
 * Clean Architecture - Infrastructure Layer
 *
 * Interceptores de Axios para autenticación.
 * Fase 4: tenant puede usar cookies httpOnly (sin Bearer en storage).
 * Refresh single-flight is scoped (tenant vs platform) so queues never mix Bearer tokens.
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
import {
  persistsAuthTokens,
  sendsBearerFromStorage,
  usesAuthCookies,
} from "../sessionMode";

export interface AuthInterceptorConfig {
  onUnauthorized: () => void;
  onForbidden: () => void;
  onSubscriptionRequired?: () => void;
  onTokenRefreshed?: (newToken: string) => void;
}

type AuthScope = "platform" | "tenant";

type PendingRetry = {
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig & { _retry?: boolean };
};

type ScopeRefreshState = {
  isRefreshing: boolean;
  pendingRetries: PendingRetry[];
};

const refreshStateByScope: Record<AuthScope, ScopeRefreshState> = {
  tenant: { isRefreshing: false, pendingRetries: [] },
  platform: { isRefreshing: false, pendingRetries: [] },
};

function setBearerToken(
  config: InternalAxiosRequestConfig,
  accessToken: string,
): void {
  const headers = AxiosHeaders.from(config.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  config.headers = headers;
}

function rejectPending(scope: AuthScope, error: unknown): void {
  const state = refreshStateByScope[scope];
  state.pendingRetries.forEach(({ reject }) => reject(error));
  state.pendingRetries.length = 0;
}

function replayPending(
  scope: AuthScope,
  instance: AxiosInstance,
  accessToken: string,
): void {
  const state = refreshStateByScope[scope];
  const pending = state.pendingRetries.splice(0, state.pendingRetries.length);
  pending.forEach(({ resolve, reject, config }) => {
    if (accessToken) {
      setBearerToken(config, accessToken);
    }
    instance(config).then(resolve).catch(reject);
  });
}

function resolveAuthScope(
  requestConfig: InternalAxiosRequestConfig,
): AuthScope {
  if (requestConfig.authScope === "platform") return "platform";
  if (requestConfig.authScope === "tenant") return "tenant";
  const url = requestConfig.url ?? "";
  if (url.includes("/platform/")) return "platform";
  return "tenant";
}

function getTokenStorage(scope: AuthScope) {
  return scope === "platform" ? platformTokenStorage : tokenStorage;
}

function isRefreshRequest(
  requestConfig: InternalAxiosRequestConfig,
  scope: AuthScope,
): boolean {
  const url = requestConfig.url ?? "";
  if (scope === "platform") {
    return url.includes("/platform/auth/refresh");
  }
  return url.includes("/auth/refresh");
}

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
    url.includes("/auth/verify-email") ||
    url.includes("/auth/mfa/verify") ||
    url.includes("/onboarding/") ||
    url.includes("/platform/auth/login") ||
    url.includes("/platform/auth/refresh") ||
    url.includes("/platform/auth/logout") ||
    url.includes("/platform/auth/mfa/verify")
  );
}

function isRegistrationClosedForbidden(error: AxiosError): boolean {
  if (error.response?.status !== 403) {
    return false;
  }
  const body = error.response.data as { code?: string } | undefined;
  return body?.code === "REGISTRATION_CLOSED";
}

function canAttemptTenantCookieRefresh(): boolean {
  return (
    usesAuthCookies() &&
    !persistsAuthTokens() &&
    Boolean(tokenStorage.getUser())
  );
}

async function refreshAccessToken(
  instance: AxiosInstance,
  scope: AuthScope,
): Promise<string> {
  const endpoint =
    scope === "platform" ? "/platform/auth/refresh" : "/auth/refresh";

  if (scope === "tenant" && canAttemptTenantCookieRefresh()) {
    await instance.post(endpoint, {});
    // erp_at renovada vía Set-Cookie; no hay token legible en JS
    return "";
  }

  const storage = getTokenStorage(scope);
  const refreshToken = storage.getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await instance.post(endpoint, {
    refresh_token: refreshToken,
  });

  const newToken = response?.data?.data?.access_token as string | undefined;

  if (!newToken) {
    // dual/cookies: body puede omitir tokens; cookie renovada
    if (scope === "tenant" && usesAuthCookies()) {
      return "";
    }
    throw new Error("Refresh response missing access_token");
  }

  storage.setToken(newToken);
  const newRefresh = response?.data?.data?.refresh_token as string | undefined;
  if (newRefresh) {
    storage.setRefreshToken(newRefresh);
  }
  return newToken;
}

export function setupAuthInterceptor(
  axiosInstance: AxiosInstance,
  config: AuthInterceptorConfig,
): () => void {
  const requestInterceptorId = axiosInstance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      const scope = resolveAuthScope(requestConfig);
      const storage = getTokenStorage(scope);
      const token = storage.getToken();

      // Never send tenant cookies on platform API calls (identity isolation).
      if (scope === "platform") {
        requestConfig.withCredentials = false;
      }

      const attachBearer =
        scope === "platform"
          ? Boolean(token) && !isPublicAuthPath(requestConfig)
          : sendsBearerFromStorage() &&
            Boolean(token) &&
            !isPublicAuthPath(requestConfig);

      if (attachBearer && token) {
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
        if (isRegistrationClosedForbidden(error)) {
          return Promise.reject(error);
        }
        console.log("[AuthInterceptor] 403 Forbidden received");
        config.onForbidden();
        return Promise.reject(error);
      }

      if (error.response?.status === 402) {
        const body = error.response.data as { code?: string } | undefined;
        if (body?.code === "SUBSCRIPTION_REQUIRED") {
          config.onSubscriptionRequired?.();
        }
        return Promise.reject(error);
      }

      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      if (!originalRequest) {
        config.onUnauthorized();
        return Promise.reject(error);
      }

      if (isPublicAuthPath(originalRequest)) {
        return Promise.reject(error);
      }

      const scope = resolveAuthScope(originalRequest);
      const scopeState = refreshStateByScope[scope];

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

      const storage = getTokenStorage(scope);
      const hasRefreshMaterial =
        scope === "tenant" && canAttemptTenantCookieRefresh()
          ? true
          : Boolean(storage.getRefreshToken());

      if (!hasRefreshMaterial) {
        if (storage.getToken() || (scope === "tenant" && storage.getUser())) {
          if (scope === "platform") {
            platformTokenStorage.clear();
            notifyPlatformUnauthorized();
          } else {
            config.onUnauthorized();
          }
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (scopeState.isRefreshing) {
        return new Promise((resolve, reject) => {
          scopeState.pendingRetries.push({
            resolve,
            reject,
            config: originalRequest,
          });
        });
      }

      scopeState.isRefreshing = true;

      try {
        console.log(
          `[AuthInterceptor] 401 (${scope}), attempting token refresh...`,
        );
        const newToken = await refreshAccessToken(axiosInstance, scope);
        console.log(`[AuthInterceptor] Token refreshed successfully (${scope})`);
        if (scope === "tenant" && newToken) {
          config.onTokenRefreshed?.(newToken);
        }

        replayPending(scope, axiosInstance, newToken);

        if (newToken) {
          setBearerToken(originalRequest, newToken);
        }
        return await axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error(
          `[AuthInterceptor] Token refresh failed (${scope}):`,
          refreshError,
        );
        rejectPending(scope, refreshError);
        if (scope === "platform") {
          platformTokenStorage.clear();
          notifyPlatformUnauthorized();
        } else {
          config.onUnauthorized();
        }
        return Promise.reject(error);
      } finally {
        scopeState.isRefreshing = false;
      }
    },
  );

  console.log("[AuthInterceptor] Interceptors configured successfully");

  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptorId);
    axiosInstance.interceptors.response.eject(responseInterceptorId);
  };
}
