/**
 * Respuesta de error estándar de la API
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  message?: string;
  details?: Record<string, unknown>;
}

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Respuesta paginada de la API
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
 * Parámetros de paginación para requests
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Parámetros de filtrado genéricos
 */
export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Combina parámetros de paginación y filtrado
 */
export type QueryParams = PaginationParams & FilterParams;
