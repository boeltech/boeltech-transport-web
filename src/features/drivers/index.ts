/**
 * Drivers Feature - Public API
 * Clean Architecture
 *
 * Este archivo expone la API pública del feature de conductores.
 * Otros módulos SOLO deben importar desde este archivo.
 */

// ============================================================================
// DOMAIN (Entities, Types, Interfaces)
// ============================================================================

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
  // DTOs
  type CreateDriverDTO,
  type UpdateDriverDTO,
  type UpdateDriverStatusDTO,
  // Repository Interface
  type IDriverRepository,
  // Additional Types
  type DriverTripSummary,
} from "./domain";

// ============================================================================
// APPLICATION (Hooks, Use Cases)
// ============================================================================

export {
  // Hooks
  useDrivers,
  useDriver,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
  useUpdateDriverStatus,
  // Use Cases
  GetDriversUseCase,
  createGetDriversUseCase,
  GetDriverUseCase,
  createGetDriverUseCase,
  CreateDriverUseCase,
  createCreateDriverUseCase,
  UpdateDriverUseCase,
  createUpdateDriverUseCase,
  DeleteDriverUseCase,
  createDeleteDriverUseCase,
  UpdateDriverStatusUseCase,
  createUpdateDriverStatusUseCase,
} from "./application";

// ============================================================================
// INFRASTRUCTURE (Repository, Mappers)
// ============================================================================

export {
  DriverRepository,
  createDriverRepository,
  driverRepository,
} from "./infrastructure";

// ============================================================================
// PRESENTATION (Components, Pages, Config)
// ============================================================================

export {
  // Components
  DriverStatusBadge,
  DriverCard,
  DriverCardSkeleton,
  DriverTable,
  DriverActions,
  // Pages
  DriversListPage,
  // Config
  DRIVER_STATUS_CONFIG,
  getDriverStatusConfig,
  getDaysUntilLicenseExpiration,
  getLicenseExpirationVariant,
  formatDriverName,
  // Utils
  generatePageNumbers,
} from "./presentation";
