/**
 * Driver Repository Interface
 * Clean Architecture - Domain Layer (Ports)
 *
 * Define los DTOs y la interfaz del repositorio.
 * La implementación está en la capa de infraestructura.
 */

import type {
  MappedActionResult,
  MappedPaginatedResult,
  MappedSingleResult,
} from "@shared/api";
import type {
  Driver,
  DriverListItem,
  DriverQueryParams,
  DriverStatusType,
  DriverTripSummary,
  LicenseTypeValue,
} from "./entities";

// ============================================================================
// DTOs - Create
// ============================================================================

/**
 * DTO para crear un conductor.
 * Solo requiere employee_id y datos de licencia.
 * Los datos personales ya existen en employees.
 */
export interface CreateDriverDTO {
  // Referencia al empleado (REQUERIDO)
  employeeId: string;

  // Licencia (REQUERIDO)
  licenseNumber: string;
  licenseType: LicenseTypeValue;
  licenseExpiry: string; // YYYY-MM-DD
  licenseIssuingState?: string;

  // Certificado médico (OPCIONAL)
  medicalCertificateNumber?: string;
  medicalCertificateExpiry?: string; // YYYY-MM-DD
  medicalCertificateIssuer?: string;

  // Examen psicométrico (OPCIONAL)
  psychometricTestDate?: string; // YYYY-MM-DD
  psychometricTestResult?: string;

  // Examen antidoping (OPCIONAL)
  lastDrugTestDate?: string; // YYYY-MM-DD
  drugTestResult?: string;

  // Dispositivo (OPCIONAL)
  assignedDeviceId?: string;

  // Notas (OPCIONAL)
  notes?: string;
}

// ============================================================================
// DTOs - Update
// ============================================================================

/**
 * DTO para actualizar un conductor.
 * NO se puede cambiar el employee_id.
 */
export interface UpdateDriverDTO {
  // Licencia
  licenseNumber?: string;
  licenseType?: LicenseTypeValue;
  licenseExpiry?: string;
  licenseIssuingState?: string | null;

  // Certificado médico
  medicalCertificateNumber?: string | null;
  medicalCertificateExpiry?: string | null;
  medicalCertificateIssuer?: string | null;

  // Examen psicométrico
  psychometricTestDate?: string | null;
  psychometricTestResult?: string | null;

  // Examen antidoping
  lastDrugTestDate?: string | null;
  drugTestResult?: string | null;

  // Dispositivo
  assignedDeviceId?: string | null;

  // Notas
  notes?: string | null;

  // Estado
  status?: DriverStatusType;
  isActive?: boolean;
}

/**
 * DTO para actualizar el estado del conductor
 */
export interface UpdateDriverStatusDTO {
  status: DriverStatusType;
  reason?: string;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Repository Interface
// ============================================================================

/**
 * Interfaz del repositorio de conductores.
 * Define el contrato que debe implementar la capa de infraestructura.
 */
export interface IDriverRepository {
  // Queries
  // getAll(params?: DriverQueryParams): Promise<PaginatedResult<DriverListItem>>;
  findAll(
    params?: DriverQueryParams,
  ): Promise<MappedPaginatedResult<DriverListItem>>;
  // getById(id: string): Promise<Driver | null>;
  findById(id: string): Promise<MappedSingleResult<Driver | null>>;
  // checkLicenseNumber(
  //   licenseNumber: string,
  //   excludeId?: string,
  // ): Promise<boolean>;
  existsByLicenseNumber(licenseNumber: string): Promise<boolean>;
  // getAvailable(): Promise<DriverListItem[]>;
  findAvailable(): Promise<DriverListItem[]>;
  // getTrips(
  //   driverId: string,
  //   params: { page: number; limit: number },
  // ): Promise<PaginatedResult<DriverTripSummary>>;
  findTrips(
    driverId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MappedPaginatedResult<DriverTripSummary>>;

  // Commands
  create(data: CreateDriverDTO): Promise<MappedSingleResult<Driver>>;
  update(
    id: string,
    data: UpdateDriverDTO,
  ): Promise<MappedSingleResult<Driver>>;
  updateStatus(
    id: string,
    data: UpdateDriverStatusDTO,
  ): Promise<MappedSingleResult<Driver>>;
  delete(id: string): Promise<MappedActionResult>;
}
