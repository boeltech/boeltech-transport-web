/**
 * Domain Layer - Public API
 * Clean Architecture
 *
 * Exporta todas las entidades, reglas e interfaces del dominio.
 *
 * Estructura:
 * - entities.ts: Entidades, Value Objects, Enums, Tipos
 * - rules.ts: Reglas de negocio puras (validadores, cálculos)
 * - repository.ts: Interfaces de repositorio (Ports)
 */

// ============================================================================
// ENTITIES & TYPES
// ============================================================================

export {
  // Enums
  TripStatus,
  StopType,
  StopStatus,
  // Types
  type TripStatusType,
  type StopTypeValue,
  type StopStatusValue,
  type ExpenseCategoryType,
  type ExpenseStatusType,
  type CargoStatusType,
  // Value Objects
  type Coordinates,
  type Mileage,
  type CargoInfo,
  type CostBreakdown,
  // Entities
  type TripStop,
  type TripCargo,
  type TripStatusHistory,
  type VehicleRef,
  type DriverRef,
  type ClientRef,
  type TripListItem,
  type Trip,
  type TripDetail,
  // Query Types
  type TripFilters,
  type SortOptions,
  type TripQueryParams,
  // Constants
  VALID_STATUS_TRANSITIONS,
  UNIQUE_STOP_TYPES,
  TRIP_STATUS_LABELS,
  STOP_TYPE_LABELS,
  STOP_STATUS_LABELS,
  CARGO_STATUS_LABELS,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
} from "./entities";

// ============================================================================
// BUSINESS RULES
// ============================================================================

export {
  // Status Validators
  validateStatusTransition,
  canTransitionTo,
  canEditTrip,
  canDeleteTrip,
  canStartTrip,
  canFinishTrip,
  canCancelTrip,
  isTripActive,
  isTerminalStatus,
  isActiveTrip,
  getAvailableTransitions,
  // Mileage
  calculateDistance,
  validateMileageRange,
  // Duration
  calculateTripDuration,
  // Cost
  calculateTotalCost,
  // Stop Rules
  canAddStopType,
  getNextStopOrder,
  validateStopOrder,
  getOrderedStops,
  canDeleteStop,
  calculateStopsProgress,
  canModifyStops,
  canMarkStopVisited,
  // Validations
  validateFinishTripData,
  validateDateRange,
  validateDepartureNotInPast,
  // Helpers
  getStatusLabel,
} from "./rules";

// ============================================================================
// REPOSITORY INTERFACES (PORTS)
// ============================================================================

export {
  // DTOs
  type CreateCargoMovementDTO,
  type CreateCargoDTO,
  type UpdateCargoDTO,
  type CompleteCargoMovementDTO,

  // Repository Interfaces
  type ICargoRepository,
} from "./cargoRepositoryInterfaces";

export {
  // DTOs
  type CreateExpenseDTO,
  type UpdateExpenseDTO,
  type ExpensesSummary,

  // Repository Interfaces
  type IExpenseRepository,
} from "./expenseRepositoryInterfaces";

export {
  // DTOs
  type CreateTripStopDTO,
  type AddStopData,
  type UpdateStopDTO,

  // Repository Interfaces
  type IStopRepository,
} from "./stopRepositoryInterfaces";

export {
  // DTOs
  type CreateTripDTO,
  type UpdateTripDTO,
  type UpdateTripStatusDTO,
  type FinishTripDTO,
  type ExpenseCategoryValue,

  // Repository Interfaces
  type ITripRepository,

  // Service Interfaces
  type INotificationService,
  type IGeolocationService,
} from "./tripRepositoryInterfaces";
