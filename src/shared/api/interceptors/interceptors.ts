import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";

/**
 * Configuración de los interceptores
 */
interface InterceptorConfig {
  tokenStorage: {
    getToken: () => string | null;
    getRefreshToken?: () => string | null;
    setToken?: (token: string) => void;
    removeToken: () => void;
    clear?: () => void;
  };
  onUnauthorized?: () => void;
  onForbidden?: () => void;
  refreshEndpoint?: string;
}

/**
 * Estado del refresh token
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Notifica a todos los subscribers que el token fue refrescado
 */
const onTokenRefreshed = (newToken: string): void => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

/**
 * Agrega un subscriber para cuando el token sea refrescado
 */
const addRefreshSubscriber = (callback: (token: string) => void): void => {
  refreshSubscribers.push(callback);
};

/**
 * Configura los interceptores de request y response
 *
 * @param instance - Instancia de Axios
 * @param config - Configuración de interceptores
 * @returns Función para limpiar los interceptores
 */
export const setupInterceptors = (
  instance: AxiosInstance,
  config: InterceptorConfig
): (() => void) => {
  const {
    tokenStorage,
    onUnauthorized,
    onForbidden,
    refreshEndpoint = "/auth/refresh",
  } = config;

  // ============================================
  // Request Interceptor
  // ============================================
  const requestInterceptorId = instance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getToken();

      if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      return requestConfig;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // ============================================
  // Response Interceptor
  // ============================================
  const responseInterceptorId = instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _retryCount?: number;
      };

      // Si no hay config, rechazar
      if (!originalRequest) {
        return Promise.reject(error);
      }

      const status = error.response?.status;
      const errorData = error.response?.data as
        | { code?: string; error?: string }
        | undefined;

      // ----------------------------------------
      // 401 Unauthorized
      // ----------------------------------------
      if (status === 401) {
        // Si es token expirado y tenemos refresh token, intentar refresh
        if (
          errorData?.code === "TOKEN_EXPIRED" &&
          tokenStorage.getRefreshToken &&
          tokenStorage.setToken &&
          !originalRequest._retry
        ) {
          // Si ya estamos refrescando, agregar a la cola
          if (isRefreshing) {
            return new Promise((resolve) => {
              addRefreshSubscriber((newToken: string) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(instance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshToken = tokenStorage.getRefreshToken();

            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            // Llamar al endpoint de refresh (sin usar la instancia con interceptores)
            const response = await axios.post(
              `${instance.defaults.baseURL}${refreshEndpoint}`,
              { refreshToken }
            );

            const newToken = response.data.accessToken;

            // Guardar nuevo token
            tokenStorage.setToken(newToken);

            // Notificar a los subscribers
            onTokenRefreshed(newToken);

            // Reintentar la petición original
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            // Si falla el refresh, limpiar todo
            if (tokenStorage.clear) {
              tokenStorage.clear();
            } else {
              tokenStorage.removeToken();
            }

            // Llamar callback de unauthorized
            onUnauthorized?.();

            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        // Si no es token expirado o no hay refresh, limpiar y notificar
        if (tokenStorage.clear) {
          tokenStorage.clear();
        } else {
          tokenStorage.removeToken();
        }

        onUnauthorized?.();
      }

      // ----------------------------------------
      // 403 Forbidden
      // ----------------------------------------
      if (status === 403) {
        onForbidden?.();
      }

      return Promise.reject(error);
    }
  );

  // ============================================
  // Cleanup function
  // ============================================
  return () => {
    instance.interceptors.request.eject(requestInterceptorId);
    instance.interceptors.response.eject(responseInterceptorId);
  };
};

/**
 * Configura retry automático para errores de red
 *
 * @param instance - Instancia de Axios
 * @param maxRetries - Número máximo de reintentos (default: 3)
 * @param retryDelay - Delay entre reintentos en ms (default: 1000)
 */
export const setupRetryInterceptor = (
  instance: AxiosInstance,
  maxRetries = 3,
  retryDelay = 1000
): (() => void) => {
  const interceptorId = instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & {
        _retryCount?: number;
      };

      // Solo reintentar en errores de red o timeout
      const shouldRetry =
        !error.response && // Error de red (no hay response)
        config &&
        (config._retryCount ?? 0) < maxRetries;

      if (shouldRetry) {
        config._retryCount = (config._retryCount ?? 0) + 1;

        // Esperar antes de reintentar (exponential backoff)
        const delay = retryDelay * Math.pow(2, config._retryCount - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));

        console.log(
          `[ApiClient] Retry attempt ${config._retryCount}/${maxRetries} for ${config.url}`
        );

        return instance(config);
      }

      return Promise.reject(error);
    }
  );

  return () => {
    instance.interceptors.response.eject(interceptorId);
  };
};
