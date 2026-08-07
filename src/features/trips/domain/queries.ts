/**
 * Trip Domain Queries
 * Clean Architecture - Domain Layer
 *
 * Tipos para filtros, paginación y React Query keys.
 *
 * Ubicación: src/features/trips/domain/queries.ts
 */

import type { TripStatusType } from "./enums";
import type { TripInvoiceStatus } from "./entities";

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filtros para listado de viajes
 */
export interface TripFilters {
  readonly status?: TripStatusType | TripStatusType[];
  readonly clientId?: string;
  readonly driverId?: string;
  readonly vehicleId?: string;
  readonly dateFrom?: string; // ISO 8601 date
  readonly dateTo?: string; // ISO 8601 date
  readonly search?: string;
  readonly minProfit?: number;
  readonly maxProfit?: number;
  /** Solo viajes con `requires_fiscal_attention` en el API */
  readonly requiresFiscalAttention?: boolean;
  /** Filtro por estado de factura ligada (`invoice_status` en query API) */
  readonly invoiceStatus?: TripInvoiceStatus;
  /** Solo viajes in_progress con llegada programada vencida (overdue_trip). */
  readonly overdueOnly?: boolean;
  /** Solo viajes elegibles para facturar (pre-emisión v2, sin factura activa). */
  readonly invoiceableOnly?: boolean;
  /** Filtro por sucursal de origen (`origin_branch_id`); `unassigned` = NULL. */
  readonly originBranchId?: string | "unassigned";
}

/**
 * Opciones de ordenamiento
 */
export interface SortOptions {
  readonly field:
    | "scheduled_departure"
    | "trip_code"
    | "status"
    | "total_cost"
    | "total_revenue"
    | "profit"
    | "origin_city"
    | "created_at";
  readonly direction: "asc" | "desc";
}

/**
 * Parámetros de consulta completos para viajes
 */
export interface TripQueryParams {
  readonly filters?: TripFilters;
  readonly sort?: SortOptions;
  readonly page?: number;
  readonly limit?: number;
}

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Información de paginación
 */
export interface PaginationInfo {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly pagination: PaginationInfo;
}

// ============================================================================
// REACT QUERY KEYS
// ============================================================================

/**
 * Factory de query keys para el módulo de viajes
 *
 * Uso:
 * - useQuery({ queryKey: tripQueryKeys.list(params), ... })
 * - queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() })
 */
export const tripQueryKeys = {
  // Base key
  all: ["trips"] as const,

  // Lists
  lists: () => [...tripQueryKeys.all, "list"] as const,
  list: (params?: TripQueryParams) =>
    [...tripQueryKeys.lists(), params] as const,

  // Details
  details: () => [...tripQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...tripQueryKeys.details(), id] as const,

  // Sub-resources
  stops: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "stops"] as const,
  cargos: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "cargos"] as const,
  expenses: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "expenses"] as const,
  profitability: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "profitability"] as const,
  statusHistory: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "status-history"] as const,
  timeline: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "timeline"] as const,
} as const;

/**
 * Factory de query keys para cargas (cuando se consultan independientemente)
 */
export const cargoQueryKeys = {
  all: ["cargos"] as const,
  lists: () => [...cargoQueryKeys.all, "list"] as const,
  list: (tripId: string) => [...cargoQueryKeys.lists(), tripId] as const,
  details: () => [...cargoQueryKeys.all, "detail"] as const,
  detail: (cargoId: string) => [...cargoQueryKeys.details(), cargoId] as const,
  movements: (cargoId: string) =>
    [...cargoQueryKeys.detail(cargoId), "movements"] as const,
} as const;

/**
 * Factory de query keys para gastos (cuando se consultan independientemente)
 */
export const expenseQueryKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseQueryKeys.all, "list"] as const,
  list: (tripId: string) => [...expenseQueryKeys.lists(), tripId] as const,
  summary: (tripId: string) =>
    [...expenseQueryKeys.list(tripId), "summary"] as const,
  details: () => [...expenseQueryKeys.all, "detail"] as const,
  detail: (expenseId: string) =>
    [...expenseQueryKeys.details(), expenseId] as const,
} as const;

// ============================================================================
// HELPER TYPES
// ============================================================================

/** Union de retornos solo de las funciones-factory (excluye keys estáticas como `all`). */
type QueryKeyReturn<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => infer R ? R : never;
}[keyof T];

/**
 * Tipo para extraer el tipo de query key
 */
export type TripQueryKey = QueryKeyReturn<typeof tripQueryKeys>;
export type CargoQueryKey = QueryKeyReturn<typeof cargoQueryKeys>;
export type ExpenseQueryKey = QueryKeyReturn<typeof expenseQueryKeys>;
