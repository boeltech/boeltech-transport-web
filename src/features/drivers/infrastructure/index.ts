/**
 * Driver Infrastructure - Public API
 * Clean Architecture - Infrastructure Layer
 */

export {
  DriverRepository,
  createDriverRepository,
  driverRepository,
} from "./driverRepository";

export {
  mapDriver,
  mapPaginatedDriverListItems,
  mapPaginatedDriverTrips,
  toApiCreateDriver,
  toApiUpdateDriver,
  toApiUpdateStatus,
  type ApiDriverResponse,
  type ApiDriverListItemResponse,
  type ApiDriverTripResponse,
} from "./mappers";
