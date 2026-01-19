import type { AxiosInstance, AxiosRequestConfig } from "axios";
import axios from "axios";
import { setupInterceptors, setupRetryInterceptor } from "./interceptors";
import { config } from "@shared/config/index";

/**
 * Clase Singleton para el cliente API
 *
 * Implementa el patrón Singleton para garantizar una única instancia
 * de Axios configurada en toda la aplicación.
 *
 * @example
 * // Obtener la instancia
 * const api = ApiClient.getInstance();
 *
 * // Usar directamente
 * const response = await api.get('/vehicles');
 *
 * // O usar el export por defecto
 * import { apiClient } from '@shared/api';
 * const response = await apiClient.get('/vehicles');
 */
class ApiClient {
  private static instance: ApiClient | null = null;
  private axiosInstance: AxiosInstance;
  private cleanupInterceptors: (() => void) | null = null;
  private cleanupRetry: (() => void) | null = null;

  /**
   * Constructor privado - Solo se puede instanciar desde getInstance()
   */
  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: config.api.headers,
      // Validar status codes
      validateStatus: (status) => status >= 200 && status < 300,
    });
  }

  /**
   * Obtiene la instancia única del ApiClient (Singleton)
   */
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Resetea la instancia (útil para testing)
   */
  public static resetInstance(): void {
    if (ApiClient.instance) {
      ApiClient.instance.cleanup();
      ApiClient.instance = null;
    }
  }

  /**
   * Obtiene la instancia de Axios subyacente
   */
  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Configura los interceptores con las dependencias necesarias
   * Se llama desde AuthProvider una vez que el contexto está listo
   */
  public configureInterceptors(config: {
    getToken: () => string | null;
    getRefreshToken?: () => string | null;
    setToken?: (token: string) => void;
    removeToken: () => void;
    clear?: () => void;
    onUnauthorized?: () => void;
    onForbidden?: () => void;
  }): void {
    // Limpiar interceptores anteriores si existen
    if (this.cleanupInterceptors) {
      this.cleanupInterceptors();
    }

    // Configurar nuevos interceptores
    this.cleanupInterceptors = setupInterceptors(this.axiosInstance, {
      tokenStorage: {
        getToken: config.getToken,
        getRefreshToken: config.getRefreshToken,
        setToken: config.setToken,
        removeToken: config.removeToken,
        clear: config.clear,
      },
      onUnauthorized: config.onUnauthorized,
      onForbidden: config.onForbidden,
    });

    // Configurar retry para errores de red (opcional)
    if (import.meta.env.VITE_ENABLE_RETRY === "true") {
      this.cleanupRetry = setupRetryInterceptor(this.axiosInstance);
    }
  }

  /**
   * Limpia los interceptores
   */
  public cleanup(): void {
    if (this.cleanupInterceptors) {
      this.cleanupInterceptors();
      this.cleanupInterceptors = null;
    }
    if (this.cleanupRetry) {
      this.cleanupRetry();
      this.cleanupRetry = null;
    }
  }

  // ============================================
  // Métodos HTTP
  // ============================================

  /**
   * GET request
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  public async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }

  // ============================================
  // Métodos utilitarios
  // ============================================

  /**
   * Sube un archivo
   *
   * @example
   * const result = await apiClient.uploadFile(
   *   '/api/vehicles/1/photo',
   *   file,
   *   'photo',
   *   { vehicleId: '1' },
   *   (progress) => console.log(`${progress}%`)
   * );
   */
  public async uploadFile<T>(
    url: string,
    file: File,
    fieldName = "file",
    additionalData?: Record<string, string>,
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.axiosInstance.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  /**
   * Sube múltiples archivos
   */
  public async uploadFiles<T>(
    url: string,
    files: File[],
    fieldName = "files",
    additionalData?: Record<string, string>,
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append(fieldName, file);
    });

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.axiosInstance.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  /**
   * Descarga un archivo
   *
   * @example
   * await apiClient.downloadFile('/api/reports/monthly', 'reporte-enero.pdf');
   */
  public async downloadFile(
    url: string,
    filename: string,
    config?: AxiosRequestConfig,
  ): Promise<void> {
    const response = await this.axiosInstance.get(url, {
      ...config,
      responseType: "blob",
    });

    // Crear URL del blob y descargar
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Crea un token de cancelación para abortar requests
   *
   * @example
   * const { token, cancel } = apiClient.createCancelToken();
   *
   * // Iniciar request
   * apiClient.get('/api/search', { signal: token.signal });
   *
   * // Cancelar si es necesario
   * cancel();
   */
  public createCancelToken(): {
    token: AbortController;
    cancel: () => void;
  } {
    const controller = new AbortController();
    return {
      token: controller,
      cancel: () => controller.abort(),
    };
  }
}

// ============================================
// Exports
// ============================================

/**
 * Instancia singleton del cliente API
 * Esta es la forma principal de usar el cliente
 */
export const apiClient = ApiClient.getInstance();

/**
 * Clase ApiClient para casos donde se necesite más control
 */
export { ApiClient };

/**
 * Instancia de Axios para uso directo (legacy o casos especiales)
 */
export const axiosInstance = apiClient.getAxiosInstance();
