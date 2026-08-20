/**
 * Trailer Domain Entities (ADR-0077)
 * Clean Architecture - Domain Layer
 */

// ============================================================================
// ENUMS
// ============================================================================

export const TrailerStatus = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  ON_TRIP: "on_trip",
  OUT_OF_SERVICE: "out_of_service",
} as const;

export type TrailerStatusType =
  (typeof TrailerStatus)[keyof typeof TrailerStatus];

export const TRAILER_STATUS_LABELS: Record<TrailerStatusType, string> = {
  [TrailerStatus.AVAILABLE]: "Disponible",
  [TrailerStatus.RESERVED]: "Reservado",
  [TrailerStatus.ON_TRIP]: "En viaje",
  [TrailerStatus.OUT_OF_SERVICE]: "Fuera de servicio",
};

// ============================================================================
// ENTITIES
// ============================================================================

export interface Trailer {
  readonly id: string;
  readonly tenantId: string;
  readonly licensePlate: string;
  readonly satSubTipoRemCode: string;
  readonly status: TrailerStatusType;
  readonly branchId: string | null;
  readonly isActive: boolean;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

export type TrailerListItem = Trailer;

/** Remolque clasificado para asignación a viajes (pool S/R). */
export interface AssignableTrailerItem extends TrailerListItem {
  readonly canBeAssigned: boolean;
  readonly blockReason?: string;
}

// ============================================================================
// DTOs
// ============================================================================

export interface CreateTrailerPayload {
  readonly licensePlate: string;
  readonly satSubTipoRemCode: string;
  readonly branchId?: string | null;
  readonly notes?: string | null;
}

export interface UpdateTrailerPayload {
  readonly licensePlate?: string;
  readonly satSubTipoRemCode?: string;
  readonly branchId?: string | null;
  readonly notes?: string | null;
}

// ============================================================================
// QUERY
// ============================================================================

export interface TrailerFiltersType {
  readonly status?: TrailerStatusType | TrailerStatusType[];
  readonly isActive?: boolean;
  readonly search?: string;
  readonly branchId?: string;
}

export interface TrailerSortOptions {
  readonly field:
    | "license_plate"
    | "status"
    | "created_at"
    | "sat_sub_tipo_rem_code";
  readonly direction: "asc" | "desc";
}

export interface TrailerQueryParams {
  readonly filters?: TrailerFiltersType;
  readonly sort?: TrailerSortOptions;
  readonly page?: number;
  readonly limit?: number;
}

export const trailerQueryKeys = {
  all: ["trailers"] as const,
  lists: () => [...trailerQueryKeys.all, "list"] as const,
  list: (params?: TrailerQueryParams) =>
    [...trailerQueryKeys.lists(), params] as const,
  details: () => [...trailerQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...trailerQueryKeys.details(), id] as const,
  assignable: () => [...trailerQueryKeys.all, "assignable"] as const,
} as const;
