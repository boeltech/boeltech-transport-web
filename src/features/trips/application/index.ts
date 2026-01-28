/**
 * Application Layer - Public API
 * Clean Architecture
 *
 * Exporta todos los casos de uso
 */

// Trip Use Cases
export {
  type GetTripsUseCase,
  type GetTripByIdUseCase,
  type CreateTripUseCase,
  type CreateTripInput,
  type UpdateTripUseCase,
  type UpdateTripStatusUseCase,
  type FinishTripUseCase,
  type FinishTripInput,
  type DeleteTripUseCase,
  type StartTripUseCase,
  type CancelTripUseCase,
  createGetTripsUseCase,
  createGetTripByIdUseCase,
  createCreateTripUseCase,
  createUpdateTripUseCase,
  createUpdateTripStatusUseCase,
  createFinishTripUseCase,
  createDeleteTripUseCase,
  createStartTripUseCase,
  createCancelTripUseCase,
} from "./useCases/trips";

// Stop Use Cases
export {
  type GetStopsUseCase,
  type AddStopUseCase,
  type AddStopInput,
  type UpdateStopUseCase,
  type DeleteStopUseCase,
  type ReorderStopsUseCase,
  type MarkStopVisitedUseCase,
  createGetStopsUseCase,
  createAddStopUseCase,
  createUpdateStopUseCase,
  createDeleteStopUseCase,
  createReorderStopsUseCase,
  createMarkStopVisitedUseCase,
} from "./useCases/stops";

// React Query hooks
export { useTrips } from "../application/hooks/useTrips";
export { useTrip } from "../application/hooks/useTrip";
export { useTripStops } from "../application/hooks/useTripStops";
export { useCreateTrip } from "../application/hooks/useCreateTrip";
export { useUpdateTrip } from "../application/hooks/useUpdateTrip";
export { useUpdateTripStatus } from "../application/hooks/useUpdateTripStatus";
export { useStartTrip } from "../application/hooks/useStartTrip";
export { useFinishTrip } from "../application/hooks/useFinishTrip";
export { useCancelTrip } from "../application/hooks/useCancelTrip";
export { useDeleteTrip } from "../application/hooks/useDeleteTrip";
export { useAddStop } from "../application/hooks/useAddStop";
export { useMarkStopVisited } from "../application/hooks/useMarkStopVisited";
