/**
 * Driver Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades del negocio, Value Objects, Enums y Constantes.
 * Los DTOs e Interfaces de repositorio están en repository.ts (Ports).
 *
 * REGLA: Esta capa NO debe importar nada de otras capas.
 */

import type { TripStatusType } from "@features/trips";

// ============================================================================
// ENUMS
// ============================================================================

export const DriverStatus = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  ON_TRIP: "on_trip",
  RESTING: "resting",
  ON_VACATION: "on_vacation",
  ON_LEAVE: "on_leave",
  TERMINATED: "terminated",
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
  readonly expirationDate: string;
  readonly issuingState: string | null;
  readonly isExpired: boolean;
  readonly daysUntilExpiration: number | null;
}

export interface MedicalCertificateInfo {
  readonly number: string | null;
  readonly expirationDate: string | null;
  readonly issuer: string | null;
}

export interface PsychometricTestInfo {
  readonly testDate: string | null;
  readonly result: string | null;
}

export interface DrugTestInfo {
  readonly testDate: string | null;
  readonly result: string | null;
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
  readonly secondLastName: string | null;
  readonly fullName: string;
  readonly email: string | null;
  readonly phone: string | null;
  /** Celular del empleado; preferido para contacto operativo frente a `phone`. */
  readonly mobilePhone: string | null;
  readonly curp: string | null;
  readonly rfc: string | null;
  readonly branchId: string | null;
  readonly branchName: string | null;
  readonly branchCode: string | null;
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
  readonly licenseExpiry: string;
  readonly status: DriverStatusType;
  readonly yearsOfExperience: number;
  readonly totalTrips: number;
  readonly isLicenseExpired: boolean;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly branchId: string | null;
  readonly branchName: string | null;
  readonly branchCode: string | null;
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
  readonly licenseExpiry: string;
  readonly licenseIssuingState: string | null;

  // Certificado médico
  readonly medicalCertificateNumber: string | null;
  readonly medicalCertificateExpiry: string | null;
  readonly medicalCertificateIssuer: string | null;

  // Examen psicométrico
  readonly psychometricTestDate: string | null;
  readonly psychometricTestResult: string | null;

  // Examen antidoping
  readonly lastDrugTestDate: string | null;
  readonly drugTestResult: string | null;

  // Dispositivo asignado
  readonly assignedDeviceId: string | null;

  // Estado y disponibilidad
  readonly status: DriverStatusType;
  readonly isActive: boolean;
  readonly yearsOfExperience: number;

  // Información del empleado (solo lectura, viene de employees)
  readonly bloodType: string | null;
  readonly emergencyContactName: string | null;
  readonly emergencyContactPhone: string | null;
  readonly emergencyContactRelationship: string | null;

  // Notas
  readonly notes: string | null;

  // Estadísticas
  readonly stats?: DriverStats;

  // Auditoría
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy: string | null;
  readonly updatedBy: string | null;
  /** Nombre completo del usuario creador (LEFT JOIN users). */
  readonly createdByName: string | null;
  /** Nombre completo del usuario que realizó la última actualización. */
  readonly updatedByName: string | null;
  readonly branchId: string | null;
  readonly branchName: string | null;
  readonly branchCode: string | null;
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

/**
 * Driver con información de asignabilidad calculada
 */
export interface AssignableDriverItem extends DriverListItem {
  canBeAssigned: boolean;
  blockReason?: string;
  displayName: string;
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

export class DriverQueryError extends Error {
  code: string;
  originalMessage?: string;

  constructor(code: string, message: string, originalMessage?: string) {
    super(message);
    this.name = "DriverQueryError";
    this.code = code;
    this.originalMessage = originalMessage;
  }
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface DriverFilters {
  readonly status?: DriverStatusType | DriverStatusType[];
  readonly licenseType?: LicenseTypeValue;
  readonly isActive?: boolean;
  readonly search?: string;
  readonly licenseExpiringSoon?: boolean;
  readonly licenseExpiringSoonDays?: number;
  readonly minExperience?: number;
  readonly maxExperience?: number;
  readonly branchId?: string;
}

export interface DriverSortOptions {
  readonly field:
    | "employee_number"
    | "employee_name"
    | "first_name"
    | "last_name"
    | "license_number"
    | "license_expiry"
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

/**
 * Resumen de un viaje asociado a un conductor
 * Usado en el endpoint GET /drivers/:id/trips
 */
export interface DriverTripSummary {
  readonly id: string;
  readonly tripCode: string;
  readonly status: TripStatusType;
  readonly scheduledDeparture: Date;
  readonly scheduledArrival: Date | null;
  readonly actualDeparture: Date | null;
  readonly actualArrival: Date | null;
  readonly originCity: string;
  readonly destinationCity: string;
  readonly vehicle: {
    readonly id: string;
    readonly unitNumber: string;
    readonly licensePlate: string;
  };
  readonly client: {
    readonly id: string;
    readonly legalName: string;
  } | null;
  readonly totalCost: number;
  readonly distance: number | null;
}

/**
 * Conductor disponible para asignación
 * Versión simplificada para selectores/dropdowns
 */
export interface DriverAvailableItem {
  readonly id: string;
  readonly employeeId: string;
  readonly employeeNumber: string;
  readonly fullName: string;
  readonly licenseType: LicenseTypeValue;
  readonly licenseNumber: string;
  readonly licenseExpiry: string;
  readonly phone?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

/**
 * Query keys para React Query - Drivers
 */
export const driverQueryKeys = {
  all: ["drivers"] as const,
  lists: () => [...driverQueryKeys.all, "list"] as const,
  list: (params?: DriverQueryParams) =>
    [...driverQueryKeys.lists(), params] as const,
  details: () => [...driverQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...driverQueryKeys.details(), id] as const,
  available: () => [...driverQueryKeys.all, "available"] as const,
  trips: (driverId: string) =>
    [...driverQueryKeys.detail(driverId), "trips"] as const,
  stats: (driverId: string) =>
    [...driverQueryKeys.detail(driverId), "stats"] as const,
  tripsPage: (driverId: string, page: number) =>
    [...driverQueryKeys.trips(driverId), { page }] as const,
};

// ============================================================================
// DOMAIN CONSTANTS
// ============================================================================

export const LICENSE_EXPIRATION_WARNING_DAYS = 30;
export const MEDICAL_CERTIFICATE_WARNING_DAYS = 30;
export const DRUG_TEST_VALIDITY_DAYS = 180; // 6 meses

export const VALID_STATUS_TRANSITIONS: Record<
  DriverStatusType,
  DriverStatusType[]
> = {
  [DriverStatus.AVAILABLE]: [
    DriverStatus.RESERVED,
    DriverStatus.ON_TRIP,
    DriverStatus.RESTING,
    DriverStatus.ON_VACATION,
    DriverStatus.ON_LEAVE,
    DriverStatus.TERMINATED,
  ],
  [DriverStatus.RESERVED]: [DriverStatus.AVAILABLE, DriverStatus.ON_TRIP],
  [DriverStatus.ON_TRIP]: [DriverStatus.AVAILABLE, DriverStatus.RESTING],
  [DriverStatus.RESTING]: [DriverStatus.AVAILABLE, DriverStatus.TERMINATED],
  [DriverStatus.ON_VACATION]: [DriverStatus.AVAILABLE],
  [DriverStatus.ON_LEAVE]: [DriverStatus.AVAILABLE],
  // [DriverStatus.TERMINATED]: [DriverStatus.AVAILABLE],
  [DriverStatus.TERMINATED]: [],
};

// ============================================================================
// UI LABELS
// ============================================================================

export const DRIVER_STATUS_LABELS: Record<DriverStatusType, string> = {
  [DriverStatus.AVAILABLE]: "Disponible",
  [DriverStatus.RESERVED]: "Reservado",
  [DriverStatus.ON_TRIP]: "En Viaje",
  [DriverStatus.RESTING]: "Descansando",
  [DriverStatus.ON_VACATION]: "De Vacaciones",
  [DriverStatus.ON_LEAVE]: "Con Permiso",
  [DriverStatus.TERMINATED]: "Dado de Baja",
};

export const LICENSE_TYPE_LABELS: Record<LicenseTypeValue, string> = {
  [LicenseType.A]: "Tipo A - Motocicleta",
  [LicenseType.B]: "Tipo B - Automóvil",
  [LicenseType.C]: "Tipo C - Carga hasta 3.5 ton",
  [LicenseType.D]: "Tipo D - Pasajeros",
  [LicenseType.E]: "Tipo E - Carga más de 3.5 ton",
  [LicenseType.F]: "Tipo F - Doble articulado",
};

export const PSYCHOMETRIC_RESULT_LABELS: Record<string, string> = {
  approved: "Aprobado",
  conditionally_approved: "Aprobado con observaciones",
  not_approved: "No aprobado",
  pending: "Pendiente",
};

export const DRUG_TEST_RESULT_LABELS: Record<string, string> = {
  negative: "Negativo",
  positive: "Positivo",
  pending: "Pendiente",
};

export const PSYCHOMETRIC_RESULT_COLORS: Record<string, string> = {
  approved: "success",
  conditionally_approved: "warning",
  not_approved: "destructive",
  pending: "secondary",
};

export const DRUG_TEST_RESULT_COLORS: Record<string, string> = {
  negative: "success",
  positive: "destructive",
  pending: "secondary",
};
