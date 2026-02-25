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
  type DriverAvailableItem,
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
  useAvailableDrivers,
  useDriverTrips,
  useDriverTripsInfinite,
  useDriverTripsStats,
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
  GetAvailableDriversUseCase,
  createGetAvailableDriversUseCase,
  GetDriverTripsUseCase,
  type GetDriverTripsParams,
  createGetDriverTripsUseCase,
} from "./application";

// ============================================================================
// INFRASTRUCTURE (Repository, Mappers)
// ============================================================================

export {
  DriverRepository,
  createDriverRepository,
  driverRepository,
  type ApiDriverListItemResponse,
} from "./infrastructure";

// ============================================================================
// PRESENTATION (Components, Pages, Config)
// ============================================================================

export {
  // Components
  DriverCard,
  DriverCardSkeleton,
  DriverTable,
  DriverActions,
  // Pages
  DriversListPage,
  // Config
  DRIVER_STATUS_CONFIG,
  DriverStatusBadge,
  getDriverStatusConfig,
  getDriverStatusLabel,
  getDaysUntilLicenseExpiration,
  getLicenseExpirationVariant,
  formatDriverName,
} from "./presentation";
