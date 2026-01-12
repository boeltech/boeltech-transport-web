/**
 * API Module
 *
 * Este módulo provee toda la infraestructura para comunicación con el backend.
 *
 * @example
 * // Uso básico
 * import { apiClient } from '@shared/api';
 * const vehicles = await apiClient.get<Vehicle[]>('/vehicles');
 *
 * @example
 * // Manejo de errores
 * import { apiClient, ApiError, isApiError, getErrorMessage } from '@shared/api';
 *
 * try {
 *   await apiClient.post('/vehicles', data);
 * } catch (error) {
 *   if (isApiError(error)) {
 *     if (error.isValidationError) {
 *       const fieldErrors = error.getFieldErrors();
 *       // Mostrar errores en el formulario
 *     }
 *   }
 *   toast.error(getErrorMessage(error));
 * }
 */

// Cliente API (Singleton)
export { apiClient, ApiClient, axiosInstance } from "./apiClient";

// Manejo de errores
export {
  ApiError,
  handleAxiosError,
  normalizeError,
  isApiError,
  getErrorMessage,
  logApiError,
} from "./errorHandler";

// Interceptores (para configuración avanzada)
export { setupInterceptors, setupRetryInterceptor } from "./interceptors";

// Tipos
export type {
  ApiErrorResponse,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  SearchParams,
  MutationResponse,
  EntityId,
} from "./types";

export { ApiErrorCode } from "./types";
