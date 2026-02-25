/**
 * Driver Repository Interfaces
 * Clean Architecture - Domain Layer (Ports)
 *
 * Define los contratos que la capa de infraestructura debe implementar.
 * Patrón: Ports & Adapters (Hexagonal Architecture)
 */

import type {
  MappedActionResult,
  MappedPaginatedResult,
  MappedSingleResult,
} from "@shared/api";
import type {
  Driver,
  DriverListItem,
  DriverStatusType,
  DriverQueryParams,
  LicenseTypeValue,
  DriverTripSummary,
} from "./entities";

// ============================================================================
// DTOs - Driver
// ============================================================================

/**
 * DTO para crear un conductor
 */
export interface CreateDriverDTO {
  employeeId: string;
  licenseNumber: string;
  licenseType: LicenseTypeValue;
  licenseExpiration: string; // ISO 8601 date string
  licenseIssuedDate?: string;
  licenseIssuingState?: string;
  yearsOfExperience?: number;
  bloodType?: string;
  medicalCertificateExpiration?: string;
  notes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

/**
 * DTO para actualizar un conductor
 */
export interface UpdateDriverDTO {
  employeeId?: string;
  licenseNumber?: string;
  licenseType?: LicenseTypeValue;
  licenseExpiration?: string;
  licenseIssuedDate?: string;
  licenseIssuingState?: string;
  yearsOfExperience?: number;
  bloodType?: string;
  medicalCertificateExpiration?: string;
  notes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

/**
 * DTO para actualizar el estado de un conductor
 */
export interface UpdateDriverStatusDTO {
  status: DriverStatusType;
  reason?: string;
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Interfaz del repositorio de conductores
 */
export interface IDriverRepository {
  /**
   * Obtiene todos los conductores con filtros y paginación
   */
  findAll(
    params?: DriverQueryParams,
  ): Promise<MappedPaginatedResult<DriverListItem>>;

  /**
   * Obtiene un conductor por su ID
   */
  findById(id: string): Promise<MappedSingleResult<Driver | null>>;

  /**
   * Crea un nuevo conductor
   */
  create(data: CreateDriverDTO): Promise<MappedSingleResult<Driver>>;

  /**
   * Actualiza un conductor existente
   */
  update(
    id: string,
    data: UpdateDriverDTO,
  ): Promise<MappedSingleResult<Driver>>;

  /**
   * Actualiza el estado de un conductor
   */
  updateStatus(
    id: string,
    data: UpdateDriverStatusDTO,
  ): Promise<MappedSingleResult<Driver>>;

  /**
   * Elimina un conductor
   */
  delete(id: string): Promise<MappedActionResult>;

  /**
   * Verifica si existe un conductor con el número de licencia dado
   */
  existsByLicenseNumber(licenseNumber: string): Promise<boolean>;

  /**
   * Obtiene conductores disponibles (para asignación a viajes)
   */
  findAvailable(): Promise<DriverListItem[]>;

  /**
   * Obtiene los viajes de un conductor
   */
  findTrips(
    driverId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MappedPaginatedResult<DriverTripSummary>>;
}

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

/**
 * Interfaz para servicio de validación de licencias
 */
export interface ILicenseValidationService {
  /**
   * Valida que el número de licencia tenga el formato correcto
   */
  validateLicenseNumber(licenseNumber: string): boolean;

  /**
   * Verifica si la licencia está por vencer
   */
  isLicenseExpiringSoon(expirationDate: Date, daysThreshold?: number): boolean;

  /**
   * Verifica si la licencia está vencida
   */
  isLicenseExpired(expirationDate: Date): boolean;
}

/**
 * Interfaz para servicio de notificaciones de conductores
 */
export interface IDriverNotificationService {
  /**
   * Notifica que la licencia de un conductor está por vencer
   */
  notifyLicenseExpiring(driver: Driver, daysRemaining: number): Promise<void>;

  /**
   * Notifica cambio de estado del conductor
   */
  notifyStatusChange(
    driver: Driver,
    previousStatus: DriverStatusType,
  ): Promise<void>;
}
