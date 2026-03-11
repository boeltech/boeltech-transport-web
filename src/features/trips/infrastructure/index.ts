/**
 * Infrastructure Layer - Public API
 * Clean Architecture
 */

// Repository implementations
export {
  CargoRepository,
  createCargoRepository,
  cargoRepository,
} from "./repositories/cargoRepository";

export {
  ExpenseRepository,
  createExpenseRepository,
  expenseRepository,
} from "./repositories/expenseRepository";

export {
  StopRepository,
  createStopRepository,
  stopRepository,
} from "./repositories/stopRepository";

export {
  TripRepository,
  createTripRepository,
  tripRepository,
} from "./repositories/tripRepository";

// Mappers
export {
  type ApiCargoMovementResponse,
  type ApiCargoResponse,
  mapApiCargoMovement,
  mapApiCargo,
  mapCargosResponse,
  mapCargoResponse,
  mapCargoMovementResponse,
} from "./mappers/cargoMappers";
export {
  type ApiExpenseResponse,
  type ApiExpensesSummaryResponse,
  mapApiExpense,
  mapApiExpensesSummary,
  mapExpensesResponse,
  mapExpenseResponse,
  mapExpensesSummaryResponse,
} from "./mappers/expenseMappers";
export {
  type ApiStopResponse as ApiTripStopResponse,
  mapTripStop,
} from "./mappers/stopMappers";
export {
  type ApiTripListItemResponse,
  type ApiTripResponse,
  type ApiStatusHistoryResponse,
  mapStatusHistory,
  mapTripListItem,
  mapTrip,
} from "./mappers/tripMappers";
