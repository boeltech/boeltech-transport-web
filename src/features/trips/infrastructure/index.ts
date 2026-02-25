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
  toApiCreateCargo,
  toApiUpdateCargo,
  toApiCreateCargoMovement,
} from "./mappers/cargoMappers";
export {
  type ApiExpenseResponse,
  type ApiExpensesSummaryResponse,
  mapApiExpense,
  mapApiExpensesSummary,
  mapExpensesResponse,
  mapExpenseResponse,
  mapExpensesSummaryResponse,
  toApiCreateExpense,
  toApiUpdateExpense,
} from "./mappers/expenseMappers";
export {
  type ApiTripStopResponse,
  type ApiCreateStopRequest,
  mapTripStop,
  toApiCreateStop,
} from "./mappers/stopMappers";
export {
  type ApiTripListItemResponse,
  type ApiTripResponse,
  type ApiVehicleResponse,
  type ApiDriverResponse,
  type ApiClientResponse,
  type ApiStatusHistoryResponse,
  type ApiCreateTripRequest,
  type ApiUpdateStatusRequest,
  type ApiFinishTripRequest,
  mapVehicleRef,
  mapDriverRef,
  mapClientRef,
  mapStatusHistory,
  mapTripListItem,
  mapTrip,
  mapPaginatedTripListItems,
  toApiCreateTrip,
  toApiUpdateStatus,
  toApiFinishTrip,
} from "./mappers/tripMappers";
