/**
 * Trip Domain - Barrel Export
 * Clean Architecture - Domain Layer
 *
 * Un solo punto de importación para todo el dominio de viajes.
 *
 * Uso:
 * ```typescript
 * import {
 *   // Entidades
 *   type Trip,
 *   type TripCargo,
 *   type TripExpense,
 *
 *   // Inputs
 *   type CreateTripInput,
 *   type CreateCargoInput,
 *
 *   // Enums
 *   TripStatus,
 *   type TripStatusType,
 *
 *   // Repositories
 *   type ITripRepository,
 *
 *   // Queries
 *   tripQueryKeys,
 * } from "@features/trips/domain";
 * ```
 *
 * Ubicación: src/features/trips/domain/index.ts
 */

// ============================================================================
// ENUMS, LABELS & CONSTANTS
// ============================================================================

export {
  // Trip Status
  TripStatus,
  type TripStatusType,
  TRIP_STATUS_LABELS,
  VALID_STATUS_TRANSITIONS,

  // Stop Type
  StopType,
  type StopTypeValue,
  STOP_TYPE_LABELS,
  UNIQUE_STOP_TYPES,

  // Stop Status
  StopStatus,
  type StopStatusValue,
  STOP_STATUS_LABELS,

  // Expense Category
  ExpenseCategory,
  type ExpenseCategoryType,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_ICONS,
  EXPENSE_CATEGORY_COLORS,

  // Expense Status
  ExpenseStatus,
  type ExpenseStatusType,
  EXPENSE_STATUS_LABELS,

  // Cargo Status
  CargoStatus,
  type CargoStatusType,
  CARGO_STATUS_LABELS,

  // Cargo Movement Type
  CargoMovementType,
  type CargoMovementTypeValue,
  CARGO_MOVEMENT_TYPE_LABELS,

  // Cargo Action (legacy)
  CargoAction,
  type CargoActionType,
  CARGO_ACTION_LABELS,

  // Currency
  Currency,
  type CurrencyType,
  CURRENCY_LABELS,
  CURRENCY_SYMBOLS,

  // SAT Payment Methods
  SatPaymentMethod,
  type SatPaymentMethodType,
  SAT_PAYMENT_METHOD_LABELS,

  // Helper functions
  isValidStatusTransition,
  isUniqueStopType,
  getCurrencySymbol,
} from "./enums";

// ============================================================================
// ENTITIES (readonly domain objects)
// ============================================================================

export type {
  // Value Objects
  Coordinates,
  Mileage,
  CargoInfo,
  CostBreakdown,
  DetailedCostBreakdown,
  TripProfitability,

  // Reference Entities
  VehicleRef,
  DriverRef,
  ClientRef,
  TripInternalStaff,
  TripInvoiceStatus,
  TripInvoicing,

  // Main Entities
  CargoMovement,
  TripCargo,
  TripExpense,
  TripStop,
  TripStatusHistory,
  Trip,

  // View Types
  TripListItem,
  TripDetail,

  // Summary Types
  ExpensesSummary,
  CargosSummary,
} from "./entities";

// ============================================================================
// INPUTS (for create/update operations)
// ============================================================================

export type {
  // Cargo Movement Inputs
  CreateCargoMovementInput,
  CompleteCargoMovementInput,

  // Cargo Inputs
  CreateCargoInput,
  UpdateCargoInput,

  // Expense Inputs
  CreateExpenseInput,
  UpdateExpenseInput,
  CreateTripInternalStaffInput,

  // Stop Inputs
  CreateStopInput,
  UpdateStopInput,

  // Trip Inputs
  CreateTripInput,
  UpdateTripInput,
  UpdateTripStatusInput,
  FinishTripInput,
  CancelTripInput,

  // Result Types
  CreateTripResult,
  PaginatedResult,
} from "./inputs";

// ============================================================================
// QUERIES (filters, pagination, query keys)
// ============================================================================

export type {
  // Filter Types
  TripFilters,
  SortOptions,
  TripQueryParams,

  // Pagination
  PaginationInfo,
  PaginatedResponse,

  // Query Key Types
  TripQueryKey,
  CargoQueryKey,
  ExpenseQueryKey,
  StopQueryKey,
} from "./queries";

export {
  // Query Key Factories
  tripQueryKeys,
  cargoQueryKeys,
  expenseQueryKeys,
  stopQueryKeys,
} from "./queries";

// ============================================================================
// REPOSITORIES (Ports - interfaces)
// ============================================================================

export type {
  ITripRepository,
  IStopRepository, // FALTA IMPLEMENTAR EN EL BACKEND
  ICargoRepository,
  IExpenseRepository,
} from "./repositories";

// ============================================================================
// STOP ADDRESS (Fase 4 — address_id / addresses)
// ============================================================================

export { isUnifiedAddressId } from "./stopAddress";

// ============================================================================
// RULES
// ============================================================================
export {
  calculateDistance,
  calculateStopsProgress,
  calculateTotalCost,
  calculateTripDuration,
  canAddStopType,
  canCancelTrip,
  canDeleteStop,
  canDeleteTrip,
  canEditTrip,
  canFinishTrip,
  canMarkStopVisited,
  canModifyStops,
  canStartTrip,
  canTransitionTo,
  getAvailableTransitions,
  getNextStopOrder,
  getOrderedStops,
  getStatusLabel,
  isActiveTrip,
  isTerminalStatus,
  isTripActive,
  validateDateRange,
  validateDepartureNotInPast,
  validateFinishTripData,
  validateMileageRange,
  validateStatusTransition,
  validateStopOrder,
} from "./rules";
