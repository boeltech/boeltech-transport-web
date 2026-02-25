// API Client
// export { apiClient, ApiClient, axiosInstance } from "./apiClient";

// Error handling
// export { ApiError, isApiError } from "./errorHandler";

// Types
// export type { ApiErrorResponse, PaginatedResponse, ApiResponse } from "./types";

/**
 * @file index.ts
 * @description Punto de entrada público de la capa compartida de API.
 *
 * Todos los módulos del ERP importan desde aquí:
 *
 * @example
 * import {
 *   apiClient,
 *   mapSingleResponse,
 *   mapPaginatedResponse,
 *   mapActionResponse,
 *   deepToCamel,
 *   deepToSnake,
 * } from '@/shared/api';
 *
 * @example
 * import type {
 *   ApiSingleResponse,
 *   ApiPaginatedResponse,
 *   ApiActionResponse,
 *   ApiPagination,
 *   Pagination,
 *   ApiError,
 *   MappedSingleResult,
 *   MappedPaginatedResult,
 *   MappedActionResult,
 * } from '@/shared/api';
 */

// Cliente HTTP
export { apiClient } from "./client/apiClient";

// Interceptors (para configuración avanzada)
export { setupInterceptors, setupRetryInterceptor } from "./interceptors";

// Transformadores de casing
export {
  snakeToCamel,
  camelToSnake,
  deepToCamel,
  deepToSnake,
} from "./utils/case-transformer";
export type { DeepCamelCase } from "./utils/case-transformer";

// Mappers de respuesta
export {
  mapSingleResponse,
  mapPaginatedResponse,
  mapActionResponse,
} from "./mappers/response-mapper";
export type {
  MappedSingleResult,
  MappedPaginatedResult,
  MappedActionResult,
} from "./mappers/response-mapper";

// Tipos del contrato de respuesta
export type {
  ApiSingleResponse,
  ApiPaginatedResponse,
  ApiActionResponse,
  ApiResponse,
  ApiPagination,
  Pagination,
  ApiError,
} from "./types/api-response.types";
