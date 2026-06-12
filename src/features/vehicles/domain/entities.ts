/**
 * Vehicle Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades del negocio, Enums y Constantes del módulo de Vehículos.
 * Los mappers están en mappers.ts (infraestructura).
 *
 * ACTUALIZADO: Incluye campos de Carta Porte 3.1
 *
 * REGLA: Esta capa NO debe importar nada de otras capas.
 */

// ============================================================================
// ENUMS
// ============================================================================

export const VehicleStatus = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  ON_TRIP: "on_trip",
  IN_MAINTENANCE: "in_maintenance",
  OUT_OF_SERVICE: "out_of_service",
} as const;

export type VehicleStatusType =
  (typeof VehicleStatus)[keyof typeof VehicleStatus];

export const VehicleType = {
  TRUCK: "truck",
  TORTON: "torton",
  RABON: "rabon",
  PICKUP: "pickup",
  UTILITY: "utility",
} as const;

export type VehicleTypeValue = (typeof VehicleType)[keyof typeof VehicleType];

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export interface VehicleCapacities {
  readonly loadCapacity: number | null;
  readonly volumeCapacity: number | null;
  readonly fuelTankCapacity: number | null;
  readonly expectedFuelEfficiency: number | null;
}

export interface VehicleDocumentation {
  readonly insurancePolicy: string | null;
  readonly insuranceExpiry: string | null;
  readonly sctPermitNumber: string | null;
  readonly sctPermitExpiry: string | null;
}

/**
 * Datos de Carta Porte 3.1 del vehículo
 * Nodo Autotransporte > IdentificacionVehicular + Seguros
 */
export interface VehicleCartaPorteData {
  // ── Permiso SCT ───────────────────────────────────────────────────────────
  /** Código de tipo de permiso SCT (catálogo SAT c_TipoPermiso) — PermSCT */
  readonly satTipoPermisoCode: string | null;

  // ── IdentificacionVehicular ───────────────────────────────────────────────
  /** Código de configuración vehicular (catálogo SAT c_ConfigAutotransporte) — ConfigVehicular */
  readonly satConfigAutotransporteCode: string | null;
  /** Peso bruto vehicular en toneladas métricas (máx 3 decimales) — PesoBrutoVehicular */
  readonly pesoBrutoVehicular: number | null;
  // PlacaVM → se toma de Vehicle.licensePlate (máx 7 chars en SAT)
  // AnioModeloVM → se toma de Vehicle.year

  // ── Seguros > Responsabilidad Civil (requeridos en Carta Porte) ───────────
  /** Nombre de la aseguradora de responsabilidad civil — AseguraRespCivil */
  readonly insuranceCompany: string | null;
  // PolizaRespCivil → se toma de VehicleDocumentation.insurancePolicy

  // ── Seguros > Medio Ambiente (opcionales) ─────────────────────────────────
  /** Nombre de la aseguradora de daños a medio ambiente — AseguraMedioAmbiente */
  readonly aseguraMedioAmbiente: string | null;
  /** Número de póliza de medio ambiente — PolizaMedioAmbiente */
  readonly polizaMedioAmbiente: string | null;

  // ── Seguros > Carga (opcionales) ──────────────────────────────────────────
  /** Nombre de la aseguradora de carga — AseguraCarga */
  readonly aseguraCarga: string | null;
  /** Número de póliza de seguro de carga — PolizaCarga */
  readonly polizaCarga: string | null;

  /** Remolques/Semirremolques del nodo Autotransporte:Remolques (máx. 2). */
  readonly remolques: VehicleRemolqueData[];
}

export interface VehicleRemolqueData {
  readonly position: number;
  readonly satSubTipoRemCode: string;
  readonly licensePlate: string;
}

// ============================================================================
// ENTITIES
// ============================================================================

/**
 * VehicleListItem — Shape for list/table views.
 * Subset of fields for performance.
 */
export interface VehicleListItem {
  readonly id: string;
  readonly unitNumber: string;
  readonly licensePlate: string;
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly type: VehicleTypeValue;
  readonly color: string | null;
  readonly status: VehicleStatusType;
  readonly currentMileage: number;
  readonly isActive: boolean;
  /** Póliza responsabilidad civil — listado (si la API lo incluye) */
  readonly insurancePolicy: string | null;
  readonly insuranceExpiry: string | null;
  readonly sctPermitNumber: string | null;
  readonly sctPermitExpiry: string | null;
  // Carta Porte 3.1 (útil para filtros y validaciones)
  readonly satTipoPermisoCode: string | null;
  readonly satConfigAutotransporteCode: string | null;
}

/**
 * Vehicle — Full entity for detail views.
 */
export interface Vehicle {
  readonly id: string;
  readonly tenantId: string;

  // Identification
  readonly unitNumber: string;
  readonly licensePlate: string;
  readonly vin: string | null;

  // Characteristics
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly type: VehicleTypeValue;
  readonly color: string | null;

  // Capacities
  readonly capacities: VehicleCapacities;

  // Mileage
  readonly currentMileage: number;

  // Documentation
  readonly documentation: VehicleDocumentation;

  // Carta Porte 3.1
  readonly cartaPorte: VehicleCartaPorteData;

  // Status
  readonly status: VehicleStatusType;
  readonly isActive: boolean;

  // Audit
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
  /** Nombre completo del usuario creador (LEFT JOIN users). */
  readonly createdByName: string | null;
  /** Nombre completo del usuario que realizó la última actualización. */
  readonly updatedByName: string | null;
}

/**
 * VehicleRef — Minimal reference used in other modules (e.g. Trip.vehicle)
 */
export interface VehicleRef {
  readonly id: string;
  readonly unitNumber: string;
  readonly licensePlate: string;
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly type: VehicleTypeValue;
}

/**
 * AssignableVehicleItem — Vehículo clasificado para asignación a viajes.
 * Extiende VehicleListItem con información de disponibilidad.
 * Se usa en el select de vehículos al crear/editar viajes.
 */
export type AssignableVehicleItem = VehicleListItem &
  (
    | { readonly canBeAssigned: true; readonly blockReason?: undefined }
    | { readonly canBeAssigned: false; readonly blockReason: string }
  );

// ============================================================================
// PAYLOAD TYPES (sent TO backend — camelCase)
// ============================================================================

export interface CreateVehiclePayload {
  readonly unitNumber: string;
  readonly licensePlate: string;
  readonly vin?: string;
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly type: VehicleTypeValue;
  readonly color?: string;
  readonly loadCapacity?: number;
  readonly volumeCapacity?: number;
  readonly fuelTankCapacity?: number;
  readonly expectedFuelEfficiency?: number;
  readonly currentMileage?: number;
  readonly insurancePolicy?: string;
  readonly insuranceExpiry?: string;
  readonly sctPermitNumber?: string;
  readonly sctPermitExpiry?: string;
  // Carta Porte 3.1 — Autotransporte
  readonly satTipoPermisoCode?: string;
  readonly satConfigAutotransporteCode?: string;
  readonly pesoBrutoVehicular?: number;
  readonly insuranceCompany?: string;
  readonly aseguraMedioAmbiente?: string;
  readonly polizaMedioAmbiente?: string;
  readonly aseguraCarga?: string;
  readonly polizaCarga?: string;
  readonly remolques?: Array<{
    satSubTipoRemCode: string;
    licensePlate: string;
  }>;
}

export interface UpdateVehiclePayload extends Partial<
  Omit<CreateVehiclePayload, "unitNumber">
> {
  readonly status?: VehicleStatusType;
  readonly isActive?: boolean;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface VehicleFiltersType {
  readonly status?: VehicleStatusType | VehicleStatusType[];
  readonly type?: VehicleTypeValue;
  readonly isActive?: boolean;
  readonly search?: string;
}

export interface VehicleSortOptions {
  readonly field:
    | "unit_number"
    | "license_plate"
    | "brand"
    | "status"
    | "created_at";
  readonly direction: "asc" | "desc";
}

export interface VehicleQueryParams {
  readonly filters?: VehicleFiltersType;
  readonly sort?: VehicleSortOptions;
  readonly page?: number;
  readonly limit?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const vehicleQueryKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleQueryKeys.all, "list"] as const,
  list: (params?: VehicleQueryParams) =>
    [...vehicleQueryKeys.lists(), params] as const,
  details: () => [...vehicleQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...vehicleQueryKeys.details(), id] as const,
  available: () =>
    [
      ...vehicleQueryKeys.list({
        filters: { status: "available", isActive: true },
      }),
    ] as const,
  assignable: () => [...vehicleQueryKeys.all, "assignable"] as const,
};

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================

export const VALID_STATUS_TRANSITIONS: Record<
  VehicleStatusType,
  VehicleStatusType[]
> = {
  [VehicleStatus.AVAILABLE]: [
    VehicleStatus.RESERVED,
    VehicleStatus.ON_TRIP,
    VehicleStatus.IN_MAINTENANCE,
    VehicleStatus.OUT_OF_SERVICE,
  ],
  [VehicleStatus.RESERVED]: [VehicleStatus.AVAILABLE, VehicleStatus.ON_TRIP],
  [VehicleStatus.ON_TRIP]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.IN_MAINTENANCE,
  ],
  [VehicleStatus.IN_MAINTENANCE]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.OUT_OF_SERVICE,
  ],
  [VehicleStatus.OUT_OF_SERVICE]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.IN_MAINTENANCE,
  ],
};

// ============================================================================
// UI LABELS
// ============================================================================

export const VEHICLE_STATUS_LABELS: Record<VehicleStatusType, string> = {
  [VehicleStatus.AVAILABLE]: "Disponible",
  [VehicleStatus.RESERVED]: "Reservado",
  [VehicleStatus.ON_TRIP]: "En Viaje",
  [VehicleStatus.IN_MAINTENANCE]: "En Mantenimiento",
  [VehicleStatus.OUT_OF_SERVICE]: "Fuera de Servicio",
};

export const VEHICLE_TYPE_LABELS: Record<VehicleTypeValue, string> = {
  [VehicleType.TRUCK]: "Tractocamión",
  [VehicleType.TORTON]: "Tortón",
  [VehicleType.RABON]: "Rabón",
  [VehicleType.PICKUP]: "Camioneta",
  [VehicleType.UTILITY]: "Utilitario",
};

export const VEHICLE_TYPE_ICONS: Record<VehicleTypeValue, string> = {
  [VehicleType.TRUCK]: "truck",
  [VehicleType.TORTON]: "truck",
  [VehicleType.RABON]: "truck",
  [VehicleType.PICKUP]: "car",
  [VehicleType.UTILITY]: "car",
};
