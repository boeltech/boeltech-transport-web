import type { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import type { AxiosInstance } from "axios";
import { handleAxiosError, logApiError } from "./errorHandler";
import { ApiErrorCode } from "./types";

/**
 * Tipo para el storage del token (inyectado para evitar dependencia circular)
 */
interface TokenStorage {
  getToken: () => string | null;
  removeToken: () => void;
}

/**
 * Tipo para el callback de logout
 */
type LogoutCallback = () => void;

/**
 * Configuración de los interceptores
 */
interface InterceptorsConfig {
  tokenStorage: TokenStorage;
  onUnauthorized?: LogoutCallback;
  onForbidden?: () => void;
}

/**
 * Configura los interceptores de request
 */
const setupRequestInterceptors = (
  instance: AxiosInstance,
  config: InterceptorsConfig
): number => {
  return instance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      // Agregar token de autenticación
      const token = config.tokenStorage.getToken();
      if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      // Agregar timestamp para debugging
      if (import.meta.env.DEV) {
        requestConfig.metadata = { startTime: Date.now() };
      }

      // Log en desarrollo
      if (import.meta.env.DEV) {
        console.log(
          `[API Request] ${requestConfig.method?.toUpperCase()} ${
            requestConfig.url
          }`,
          requestConfig.params || requestConfig.data || ""
        );
      }

      return requestConfig;
    },
    (error: AxiosError) => {
      return Promise.reject(handleAxiosError(error));
    }
  );
};

/**
 * Configura los interceptores de response
 */
const setupResponseInterceptors = (
  instance: AxiosInstance,
  config: InterceptorsConfig
): number => {
  return instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log de tiempo de respuesta en desarrollo
      if (import.meta.env.DEV) {
        const startTime = (response.config as any).metadata?.startTime;
        if (startTime) {
          const duration = Date.now() - startTime;
          console.log(
            `[API Response] ${response.config.method?.toUpperCase()} ${
              response.config.url
            } - ${response.status} (${duration}ms)`
          );
        }
      }

      return response;
    },
    async (error: AxiosError) => {
      const apiError = handleAxiosError(error);

      // Log del error
      logApiError(
        apiError,
        `${error.config?.method?.toUpperCase()} ${error.config?.url}`
      );

      // Manejar errores de autenticación
      if (
        apiError.code === ApiErrorCode.UNAUTHORIZED ||
        apiError.code === ApiErrorCode.TOKEN_EXPIRED ||
        apiError.code === ApiErrorCode.INVALID_TOKEN
      ) {
        config.tokenStorage.removeToken();

        if (config.onUnauthorized) {
          config.onUnauthorized();
        }
      }

      // Manejar errores de permisos
      if (
        apiError.code === ApiErrorCode.FORBIDDEN ||
        apiError.code === ApiErrorCode.INSUFFICIENT_PERMISSIONS
      ) {
        if (config.onForbidden) {
          config.onForbidden();
        }
      }

      return Promise.reject(apiError);
    }
  );
};

/**
 * Configura todos los interceptores en la instancia de Axios
 * Retorna una función para remover los interceptores (cleanup)
 */
export const setupInterceptors = (
  instance: AxiosInstance,
  config: InterceptorsConfig
): (() => void) => {
  const requestInterceptorId = setupRequestInterceptors(instance, config);
  const responseInterceptorId = setupResponseInterceptors(instance, config);

  // Retorna función de cleanup
  return () => {
    instance.interceptors.request.eject(requestInterceptorId);
    instance.interceptors.response.eject(responseInterceptorId);
  };
};

/**
 * Interceptor para retry automático (opcional)
 * Útil para errores de red temporales
 */
export const setupRetryInterceptor = (
  instance: AxiosInstance,
  maxRetries = 3,
  retryDelay = 1000
): number => {
  return instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & {
        _retryCount?: number;
      };

      // Solo reintentar errores de red o 5xx
      const shouldRetry =
        !error.response ||
        (error.response.status >= 500 && error.response.status < 600);

      if (!shouldRetry || !config) {
        return Promise.reject(error);
      }

      config._retryCount = config._retryCount || 0;

      if (config._retryCount >= maxRetries) {
        return Promise.reject(error);
      }

      config._retryCount++;

      // Esperar antes de reintentar (backoff exponencial)
      const delay = retryDelay * Math.pow(2, config._retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (import.meta.env.DEV) {
        console.log(
          `[API Retry] Attempt ${config._retryCount}/${maxRetries} for ${config.url}`
        );
      }

      return instance(config);
    }
  );
};

// Extender tipos de Axios para incluir metadata
declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}
