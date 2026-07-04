/**
 * @file api-response.types.ts
 * @description Tipos genéricos del contrato de respuesta del API.
 *
 * REGLA: Todos los módulos del ERP DEBEN consumir estas interfaces.
 * El backend siempre responde con snake_case; el frontend mapea a camelCase.
 *
 * Contrato de respuesta (API Response Standard):
 *
 * | Escenario              | HTTP  | Estructura                                         |
 * |------------------------|-------|----------------------------------------------------|
 * | Recurso único          | 200/201 | { data: {...resource}, message?: string }        |
 * | Lista paginada         | 200   | { data: [...], pagination: {...} }                 |
 * | Acción sin recurso     | 200   | { message: string }                                |
 */

// ---------------------------------------------------------------------------
// Respuesta: Recurso único
// ---------------------------------------------------------------------------

/** Respuesta del backend para un solo recurso (snake_case desde el servidor). */
export interface ApiSingleResponse<TRaw> {
  data: TRaw;
  message?: string;
}

// ---------------------------------------------------------------------------
// Respuesta: Lista paginada
// ---------------------------------------------------------------------------

/** Metadatos de paginación devueltos por el backend. */
export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/** Respuesta del backend para listas paginadas. */
export interface ApiPaginatedResponse<TRaw> {
  data: TRaw[];
  pagination: ApiPagination;
}

/** Metadatos de paginación cursor (ADR-0053 `/addresses/search`). */
export interface ApiCursorPagination {
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
}

/** Respuesta del backend para búsquedas con cursor opaco. */
export interface ApiCursorPaginatedResponse<TRaw> {
  data: TRaw[];
  pagination: ApiCursorPagination;
}

// ---------------------------------------------------------------------------
// Respuesta: Acción sin recurso (DELETE, operaciones de estado, etc.)
// ---------------------------------------------------------------------------

/** Respuesta del backend para operaciones que no devuelven recurso. */
export interface ApiActionResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// Unión de todos los escenarios posibles
// ---------------------------------------------------------------------------

export type ApiResponse<TRaw> =
  | ApiSingleResponse<TRaw>
  | ApiPaginatedResponse<TRaw>
  | ApiActionResponse;

// ---------------------------------------------------------------------------
// Paginación mapeada (camelCase — para uso en el frontend)
// ---------------------------------------------------------------------------

/** Metadatos de paginación ya mapeados a camelCase para uso en componentes. */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Paginación cursor mapeada a camelCase (ADR-0053). */
export interface CursorPagination {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
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

// ---------------------------------------------------------------------------
// Error del API
// ---------------------------------------------------------------------------

/** Estructura de error normalizada que devuelve el cliente HTTP. */
export interface ApiError {
  message: string;
  statusCode: number;
  details?: unknown;
}
