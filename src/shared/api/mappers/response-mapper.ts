/**
 * @file response-mapper.ts
 * @description Mappers del contrato de respuesta del API.
 *
 * Cada función corresponde a uno de los tres escenarios del API Response Standard:
 *  1. mapSingleResponse   → { data: {...} }
 *  2. mapPaginatedResponse → { data: [...], pagination: {...} }
 *  3. mapActionResponse   → { message: string }
 *
 * Internamente aplican deepToCamel para transformar snake_case → camelCase.
 *
 * USO RECOMENDADO:
 *   Las features NO deben llamar deepToCamel directamente.
 *   Siempre deben usar estos mappers para mantener la consistencia.
 */

import { deepToCamel, type DeepCamelCase } from "../utils/case-transformer";
import type {
  ApiSingleResponse,
  ApiPaginatedResponse,
  ApiActionResponse,
  Pagination,
} from "../types/api-response.types";

// ---------------------------------------------------------------------------
// Resultado mapeado: Recurso único
// ---------------------------------------------------------------------------

export interface MappedSingleResult<T> {
  data: T;
  message?: string;
}

// ---------------------------------------------------------------------------
// Resultado mapeado: Lista paginada
// ---------------------------------------------------------------------------

export interface MappedPaginatedResult<T> {
  data: T[];
  pagination: Pagination;
}

// ---------------------------------------------------------------------------
// Resultado mapeado: Acción sin recurso
// ---------------------------------------------------------------------------

export interface MappedActionResult {
  message: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/**
 * Mapea la respuesta de un recurso único.
 * Extrae `data` y `message`, convierte las claves a camelCase.
 *
 * @param response - Respuesta cruda del backend
 * @returns `{ data: T (camelCase), message? }`
 *
 * @example
 * // features/trips/api/trips.api.ts
 * const raw = await apiClient.get<TripRaw>('/trips/123');
 * const { data: trip } = mapSingleResponse(raw);
 */
export function mapSingleResponse<TRaw>(
  response: ApiSingleResponse<TRaw>,
): MappedSingleResult<DeepCamelCase<TRaw>> {
  return {
    data: deepToCamel(response.data),
    ...(response.message ? { message: response.message } : {}),
  };
}

/**
 * Mapea la respuesta de una lista paginada.
 * Convierte cada item del array y preserva los metadatos de paginación.
 *
 * @param response - Respuesta cruda del backend
 * @returns `{ data: T[] (camelCase), pagination }`
 *
 * @example
 * // features/trips/api/trips.api.ts
 * const raw = await apiClient.get<TripRaw>('/trips');
 * const { data: trips, pagination } = mapPaginatedResponse(raw);
 */
export function mapPaginatedResponse<TRaw>(
  response: ApiPaginatedResponse<TRaw>,
): MappedPaginatedResult<DeepCamelCase<TRaw>> {
  return {
    data: response.data.map((item) => deepToCamel(item)),
    pagination: response.pagination,
  };
}

/**
 * Mapea la respuesta de una acción sin recurso (DELETE, cambios de estado, etc.).
 *
 * @param response - Respuesta cruda del backend
 * @returns `{ message: string }`
 *
 * @example
 * // features/trips/api/trips.api.ts
 * const raw = await apiClient.delete('/trips/123');
 * const { message } = mapActionResponse(raw);
 */
export function mapActionResponse(
  response: ApiActionResponse,
): MappedActionResult {
  return {
    message: response.message,
  };
}
