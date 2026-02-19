/**
 * Driver Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades del negocio, Value Objects, Enums y Constantes.
 * Los DTOs e Interfaces de repositorio están en repository.ts (Ports).
 *
 * REGLA: Esta capa NO debe importar nada de otras capas.
 */

// ============================================================================
// ENUMS
// ============================================================================

export const DriverStatus = {
  AVAILABLE: "available",
  ON_TRIP: "on_trip",
  RESTING: "resting",
  INACTIVE: "inactive",
} as const;

export type DriverStatusType = (typeof DriverStatus)[keyof typeof DriverStatus];

export const LicenseType = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
} as const;

export type LicenseTypeValue = (typeof LicenseType)[keyof typeof LicenseType];

// ============================================================================
// VALUE OBJECTS
// ============================================================================

export interface LicenseInfo {
  readonly number: string;
  readonly type: LicenseTypeValue;
  readonly expirationDate: Date;
  readonly isExpired: boolean;
  readonly daysUntilExpiration: number | null;
}

export interface ContactInfo {
  readonly phone: string | null;
  readonly email: string | null;
  readonly emergencyContact: string | null;
  readonly emergencyPhone: string | null;
}

export interface DriverStats {
  readonly totalTrips: number;
  readonly completedTrips: number;
  readonly cancelledTrips: number;
  readonly totalKilometers: number;
  readonly averageRating: number | null;
  readonly yearsOfExperience: number;
}

// ============================================================================
// ENTITIES
// ============================================================================

/**
 * Referencia de empleado para conductor
 */
export interface EmployeeRef {
  readonly id: string;
  readonly employeeNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string | null;
  readonly phone: string | null;
}

/**
 * Conductor para listado (versión reducida)
 */
export interface DriverListItem {
  readonly id: string;
  readonly tenantId: string;
  readonly employeeId: string;
  readonly employee: EmployeeRef;
  readonly licenseNumber: string;
  readonly licenseType: LicenseTypeValue;
  readonly licenseExpiration: Date;
  readonly status: DriverStatusType;
  readonly yearsOfExperience: number;
  readonly totalTrips: number;
  readonly isLicenseExpired: boolean;
  readonly createdAt: Date;
}

/**
 * Conductor completo (Aggregate Root)
 */
export interface Driver {
  readonly id: string;
  readonly tenantId: string;
  readonly employeeId: string;
  readonly employee?: EmployeeRef;

  // Información de licencia
  readonly licenseNumber: string;
  readonly licenseType: LicenseTypeValue;
  readonly licenseExpiration: Date;
  readonly licenseIssuedDate: Date | null;
  readonly licenseIssuingState: string | null;

  // Estado y disponibilidad
  readonly status: DriverStatusType;
  readonly yearsOfExperience: number;

  // Información adicional
  readonly bloodType: string | null;
  readonly medicalCertificateExpiration: Date | null;
  readonly notes: string | null;

  // Contacto de emergencia
  readonly emergencyContactName: string | null;
  readonly emergencyContactPhone: string | null;
  readonly emergencyContactRelationship: string | null;

  // Estadísticas
  readonly stats?: DriverStats;

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
}

/**
 * Conductor con detalle completo
 */
export interface DriverDetail extends Driver {
  readonly employee: EmployeeRef;
  readonly stats: DriverStats;
  readonly currentTrip?: {
    readonly id: string;
    readonly tripCode: string;
    readonly status: string;
    readonly originCity: string;
    readonly destinationCity: string;
  } | null;
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export type DomainResult<T> =
  | { success: true; data: T }
  | { success: false; error: DomainError };

export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

export type UseCaseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export type ValidationResult =
  | { success: true }
  | { success: false; error: { code: string; message: string } };

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface DriverFilters {
  readonly status?: DriverStatusType | DriverStatusType[];
  readonly licenseType?: LicenseTypeValue;
  readonly search?: string;
  readonly licenseExpiringSoon?: boolean; // Licencias por vencer en 30 días
  readonly minExperience?: number;
  readonly maxExperience?: number;
}

export interface DriverSortOptions {
  readonly field:
    | "employee_name"
    | "license_number"
    | "license_expiration"
    | "status"
    | "years_of_experience"
    | "total_trips"
    | "created_at";
  readonly direction: "asc" | "desc";
}

export interface DriverQueryParams {
  readonly filters?: DriverFilters;
  readonly sort?: DriverSortOptions;
  readonly page?: number;
  readonly limit?: number;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const driverQueryKeys = {
  all: ["drivers"] as const,
  lists: () => [...driverQueryKeys.all, "list"] as const,
  list: (params?: DriverQueryParams) =>
    [...driverQueryKeys.lists(), params] as const,
  details: () => [...driverQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...driverQueryKeys.details(), id] as const,
  trips: (driverId: string) =>
    [...driverQueryKeys.detail(driverId), "trips"] as const,
  stats: (driverId: string) =>
    [...driverQueryKeys.detail(driverId), "stats"] as const,
  available: () => [...driverQueryKeys.all, "available"] as const,
};

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================

export const LICENSE_EXPIRATION_WARNING_DAYS = 30;

export const VALID_STATUS_TRANSITIONS: Record<
  DriverStatusType,
  DriverStatusType[]
> = {
  [DriverStatus.AVAILABLE]: [
    DriverStatus.ON_TRIP,
    DriverStatus.RESTING,
    DriverStatus.INACTIVE,
  ],
  [DriverStatus.ON_TRIP]: [DriverStatus.AVAILABLE, DriverStatus.RESTING],
  [DriverStatus.RESTING]: [DriverStatus.AVAILABLE, DriverStatus.INACTIVE],
  [DriverStatus.INACTIVE]: [DriverStatus.AVAILABLE],
};

// ============================================================================
// UI LABELS
// ============================================================================

export const DRIVER_STATUS_LABELS: Record<DriverStatusType, string> = {
  [DriverStatus.AVAILABLE]: "Disponible",
  [DriverStatus.ON_TRIP]: "En Viaje",
  [DriverStatus.RESTING]: "Descansando",
  [DriverStatus.INACTIVE]: "Inactivo",
};

export const LICENSE_TYPE_LABELS: Record<LicenseTypeValue, string> = {
  [LicenseType.A]: "Tipo A - Motocicleta",
  [LicenseType.B]: "Tipo B - Automóvil",
  [LicenseType.C]: "Tipo C - Carga hasta 3.5 ton",
  [LicenseType.D]: "Tipo D - Pasajeros",
  [LicenseType.E]: "Tipo E - Carga más de 3.5 ton",
  [LicenseType.F]: "Tipo F - Doble articulado",
};

export const DRIVER_STATUS_COLORS: Record<DriverStatusType, string> = {
  [DriverStatus.AVAILABLE]: "success",
  [DriverStatus.ON_TRIP]: "warning",
  [DriverStatus.RESTING]: "secondary",
  [DriverStatus.INACTIVE]: "destructive",
};
