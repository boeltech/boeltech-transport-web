/**
 * Driver Application Layer - Public API
 * Clean Architecture - Application Layer
 */

// Hooks (React Query)

export { useDrivers } from "./hooks/useDrivers";
export { useDriver } from "./hooks/useDriver";
export { useCreateDriver } from "./hooks/useCreateDriver";
export { useUpdateDriver } from "./hooks/useUpdateDriver";
export { useDeleteDriver } from "./hooks/useDeleteDriver";
export { useUpdateDriverStatus } from "./hooks/useUpdateDriverStatus";
export { useAvailableDrivers } from "./hooks/useAvailableDrivers";
export { useDriverTrips } from "./hooks/useDriverTrips";
export { useDriverTripsInfinite } from "./hooks/useDriverTripsInfinite";
export { useDriverTripsStats } from "./hooks/useDriverTripsStats";

// Use Cases
/**
 * Driver Use Cases - Public API
 * Clean Architecture - Application Layer
 */

export {
  GetDriversUseCase,
  createGetDriversUseCase,
} from "./useCases/GetDriversUseCase";

export {
  GetDriverUseCase,
  createGetDriverUseCase,
} from "./useCases/GetDriverUseCase";

export {
  CreateDriverUseCase,
  createCreateDriverUseCase,
} from "./useCases/CreateDriverUseCase";

export {
  UpdateDriverUseCase,
  createUpdateDriverUseCase,
} from "./useCases/UpdateDriverUseCase";

export {
  DeleteDriverUseCase,
  createDeleteDriverUseCase,
} from "./useCases/DeleteDriverUseCase";

export {
  UpdateDriverStatusUseCase,
  createUpdateDriverStatusUseCase,
} from "./useCases/UpdateDriverStatusUseCase";

export {
  GetAvailableDriversUseCase,
  createGetAvailableDriversUseCase,
} from "./useCases/GetAvailableDriversUseCase";

export {
  GetDriverTripsUseCase,
  type GetDriverTripsParams,
  createGetDriverTripsUseCase,
} from "./useCases/GetDriverTripsUseCase";
