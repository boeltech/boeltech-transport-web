/**
 * Trip Domain Entities
 * Clean Architecture - Domain Layer
 *
 * ACTUALIZADO: Alineado con la estructura del Backend
 *
 * Esta capa contiene:
 * - Entidades del negocio (sin dependencias externas)
 * - Value Objects
 * - Enums del dominio
 * - Constantes del dominio
 *
 * REGLA: Esta capa NO debe importar nada de otras capas
 */

// ============================================================================
// ENUMS - Tipos enumerados del dominio (Alineados con Backend)
// ============================================================================

/**
 * Estados posibles de un viaje
 */
export const TripStatus = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type TripStatusType = (typeof TripStatus)[keyof typeof TripStatus];

/**
 * Tipos de parada
 */
export const StopType = {
  ORIGIN: "origin",
  PICKUP: "pickup",
  DELIVERY: "delivery",
  WAYPOINT: "waypoint",
  DESTINATION: "destination",
} as const;

export type StopTypeValue = (typeof StopType)[keyof typeof StopType];

/**
 * Estados de una parada
 */
export const StopStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped",
} as const;

export type StopStatusValue = (typeof StopStatus)[keyof typeof StopStatus];

// ============================================================================
// VALUE OBJECTS - Objetos inmutables
// ============================================================================

export interface Coordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface Mileage {
  readonly start: number | null;
  readonly end: number | null;
}

export interface CargoInfo {
  readonly description: string | null;
  readonly weight: number | null;
  readonly volume: number | null;
  readonly units: number | null;
  readonly value: number | null;
}

export interface CostBreakdown {
  readonly baseRate: number;
  readonly fuelCost: number;
  readonly tollCost: number;
  readonly otherCosts: number;
  readonly totalCost: number;
}

// ============================================================================
// ENTITIES - Entidades del dominio (Alineadas con Backend)
// ============================================================================

/**
 * Entidad: Parada de viaje (TripStop)
 */
export interface TripStop {
  readonly id: string;
  readonly tenantId: string;
  readonly tripId: string;
  readonly sequenceOrder: number;
  readonly stopType: StopTypeValue;
  readonly address: string;
  readonly city: string;
  readonly state: string | null;
  readonly postalCode: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly locationName: string | null;
  readonly contactName: string | null;
  readonly contactPhone: string | null;
  readonly estimatedArrival: Date | null;
  readonly actualArrival: Date | null;
  readonly estimatedDeparture: Date | null;
  readonly actualDeparture: Date | null;
  readonly cargoActionDescription: string | null;
  readonly cargoWeight: number | null;
  readonly cargoUnits: number | null;
  readonly status: StopStatusValue;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Entidad: Historial de estado del viaje
 */
export interface TripStatusHistory {
  readonly id: string;
  readonly tripId: string;
  readonly previousStatus: TripStatusType | null;
  readonly newStatus: TripStatusType;
  readonly changedBy: string | null;
  readonly changedByName: string | null;
  readonly changedAt: Date;
  readonly mileage: number | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly reason: string | null;
}

/**
 * Entidad: Vehículo (referencia embebida)
 */
export interface VehicleRef {
  readonly id: string;
  readonly unitNumber: string;
  readonly licensePlate: string;
}

/**
 * Entidad: Conductor (referencia embebida)
 */
export interface DriverRef {
  readonly id: string;
  readonly fullName: string;
}

/**
 * Entidad: Cliente (referencia embebida)
 */
export interface ClientRef {
  readonly id: string;
  readonly legalName: string;
}

/**
 * Entidad: Item de lista de viajes (para listados)
 * Versión optimizada para queries de lista
 */
export interface TripListItem {
  readonly id: string;
  readonly tripCode: string;
  readonly vehicle: VehicleRef;
  readonly driver: DriverRef;
  readonly client: ClientRef | null;
  readonly originCity: string;
  readonly destinationCity: string;
  readonly scheduledDeparture: Date;
  readonly scheduledArrival: Date | null;
  readonly status: TripStatusType;
  readonly cargoDescription: string | null;
  readonly totalCost: number;
}

/**
 * Entidad Principal: Viaje (Trip)
 * Aggregate Root del módulo de viajes
 */
export interface Trip {
  readonly id: string;
  readonly tenantId: string;
  readonly tripCode: string;
  readonly vehicleId: string;
  readonly driverId: string;
  readonly clientId: string | null;
  readonly scheduledDeparture: Date;
  readonly scheduledArrival: Date | null;
  readonly actualDeparture: Date | null;
  readonly actualArrival: Date | null;
  readonly mileage: Mileage;
  readonly originAddress: string;
  readonly originCity: string;
  readonly originState: string | null;
  readonly destinationAddress: string;
  readonly destinationCity: string;
  readonly destinationState: string | null;
  readonly cargo: CargoInfo;
  readonly costs: CostBreakdown;
  readonly status: TripStatusType;
  readonly notes: string | null;
  readonly cancellationReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;

  // Relaciones (opcionales, para cuando se cargan con detalle)
  readonly vehicle?: VehicleRef;
  readonly driver?: DriverRef;
  readonly client?: ClientRef;
  readonly stops?: TripStop[];
  readonly statusHistory?: TripStatusHistory[];
}

/**
 * Entidad: Detalle completo del viaje
 * Incluye todas las relaciones cargadas
 */
export interface TripDetail extends Trip {
  readonly vehicle: VehicleRef;
  readonly driver: DriverRef;
  readonly client: ClientRef | undefined;
  readonly stops: TripStop[];
  readonly statusHistory: TripStatusHistory[];
}

// ============================================================================
// DOMAIN TYPES - Tipos auxiliares del dominio
// ============================================================================

/**
 * Resultado de una operación de dominio
 */
export type DomainResult<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError };

/**
 * Error de dominio
 */
export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

/**
 * Resultado de caso de uso
 */
export type UseCaseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Resultado de validación
 */
export type ValidationResult =
  | { success: true }
  | { success: false; error: { code: string; message: string } };

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Información de paginación
 */
export interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

/**
 * Lista paginada genérica
 */
export interface PaginatedList<T> {
  readonly items: T[];
  readonly pagination: Pagination;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * Filtros de búsqueda de viajes
 */
export interface TripFilters {
  readonly status?: TripStatusType | TripStatusType[];
  readonly clientId?: string;
  readonly driverId?: string;
  readonly vehicleId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly search?: string;
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
    | "origin_city"
    | "created_at";
  readonly direction: "asc" | "desc";
}

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Parámetros de consulta completos
 */
export interface TripQueryParams {
  readonly filters?: TripFilters;
  readonly sort?: SortOptions;
  readonly page?: number;
  readonly limit?: number;
}

export const tripQueryKeys = {
  all: ["trips"] as const,
  lists: () => [...tripQueryKeys.all, "list"] as const,
  list: (params?: TripQueryParams) =>
    [...tripQueryKeys.lists(), params] as const,
  details: () => [...tripQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...tripQueryKeys.details(), id] as const,
  stops: (tripId: string) =>
    [...tripQueryKeys.detail(tripId), "stops"] as const,
};

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================

/**
 * Matriz de transiciones válidas de estado
 * Define qué estados pueden pasar a qué otros estados
 */
export const VALID_STATUS_TRANSITIONS: Record<
  TripStatusType,
  TripStatusType[]
> = {
  [TripStatus.DRAFT]: [TripStatus.SCHEDULED, TripStatus.CANCELLED],
  [TripStatus.SCHEDULED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};

/**
 * Tipos de parada que solo pueden existir una vez por viaje
 */
export const UNIQUE_STOP_TYPES: readonly StopTypeValue[] = [
  StopType.ORIGIN,
  StopType.DESTINATION,
] as const;

/**
 * Etiquetas de estado para UI
 */
export const TRIP_STATUS_LABELS: Record<TripStatusType, string> = {
  [TripStatus.DRAFT]: "Borrador",
  [TripStatus.SCHEDULED]: "Programado",
  [TripStatus.IN_PROGRESS]: "En Curso",
  [TripStatus.COMPLETED]: "Completado",
  [TripStatus.CANCELLED]: "Cancelado",
};

/**
 * Etiquetas de tipo de parada para UI
 */
export const STOP_TYPE_LABELS: Record<StopTypeValue, string> = {
  [StopType.ORIGIN]: "Origen",
  [StopType.PICKUP]: "Carga",
  [StopType.DELIVERY]: "Descarga",
  [StopType.WAYPOINT]: "Escala",
  [StopType.DESTINATION]: "Destino",
};

/**
 * Etiquetas de estado de parada para UI
 */
export const STOP_STATUS_LABELS: Record<StopStatusValue, string> = {
  [StopStatus.PENDING]: "Pendiente",
  [StopStatus.IN_PROGRESS]: "En Progreso",
  [StopStatus.COMPLETED]: "Completado",
  [StopStatus.SKIPPED]: "Omitido",
};
