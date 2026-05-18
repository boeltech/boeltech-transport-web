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
  type AssignableDriverItem,
  DriverQueryError,
  // Query Types
  type DriverFilters,
  type DriverSortOptions,
  type DriverQueryParams,
  type DriverTripSummary,
  type DriverAvailableItem,
  // Query Keys
  driverQueryKeys,
  // Constants
  LICENSE_EXPIRATION_WARNING_DAYS,
  VALID_STATUS_TRANSITIONS,
  // Labels
  DRIVER_STATUS_LABELS,
  LICENSE_TYPE_LABELS,
  PSYCHOMETRIC_RESULT_LABELS,
  DRUG_TEST_RESULT_LABELS,
  // Colors
  PSYCHOMETRIC_RESULT_COLORS,
  DRUG_TEST_RESULT_COLORS,
} from "./entities";

// Repository Interfaces & DTOs
export {
  // DTOs
  type CreateDriverDTO,
  type UpdateDriverDTO,
  type UpdateDriverStatusDTO,
  // Repository Interface
  type IDriverRepository,
} from "./repository";
