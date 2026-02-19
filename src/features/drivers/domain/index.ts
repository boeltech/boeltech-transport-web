/**
 * Driver Domain - Public API
 * Clean Architecture - Domain Layer
 *
 * Este archivo exporta todo lo público del dominio de conductores.
 */

// Entities, Enums, Types
export {
  // Enums
  DriverStatus,
  LicenseType,
  // Types
  type DriverStatusType,
  type LicenseTypeValue,
  // Value Objects
  type LicenseInfo,
  type ContactInfo,
  type DriverStats,
  // Entities
  type EmployeeRef,
  type DriverListItem,
  type Driver,
  type DriverDetail,
  // Domain Types
  type DomainResult,
  type DomainError,
  type UseCaseResult,
  type ValidationResult,
  // Query Types
  type DriverFilters,
  type DriverSortOptions,
  type DriverQueryParams,
  // Query Keys
  driverQueryKeys,
  // Constants
  LICENSE_EXPIRATION_WARNING_DAYS,
  VALID_STATUS_TRANSITIONS,
  // Labels
  DRIVER_STATUS_LABELS,
  LICENSE_TYPE_LABELS,
  DRIVER_STATUS_COLORS,
} from "./entities";

// Repository Interfaces & DTOs
export {
  // DTOs
  type CreateDriverDTO,
  type UpdateDriverDTO,
  type UpdateDriverStatusDTO,
  // Repository Interface
  type IDriverRepository,
  // Additional Types
  type DriverTripSummary,
  // Service Interfaces
  type ILicenseValidationService,
  type IDriverNotificationService,
} from "./repository";
