/**
 * Códigos de error de la API
 */
export enum ApiErrorCode {
  // Errores de autenticación
  UNAUTHORIZED = "UNAUTHORIZED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",

  // Errores de autorización
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Errores de validación
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Errores de recursos
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  CONFLICT = "CONFLICT",

  // Errores de servidor
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Errores de red
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",

  // Error desconocido
  UNKNOWN = "UNKNOWN",
}

/**
 * Estructura de error de la API
 */
export interface ApiErrorResponse {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, string[]>; // Errores de validación por campo
  timestamp?: string;
  path?: string;
}

/**
 * Respuesta exitosa genérica
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parámetros de paginación
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Parámetros de búsqueda comunes
 */
export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, string | number | boolean>;
}

/**
 * Respuesta de operaciones de escritura
 */
export interface MutationResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Tipo para IDs
 */
export type EntityId = string | number;
