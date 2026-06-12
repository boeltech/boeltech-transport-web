import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { TripStatus, tripQueryKeys, type Trip } from "@features/trips/domain";
import { tripRepository, trackingRepository } from "@features/trips/infrastructure";
import { invalidateTripAssignmentResources } from "./invalidateTripAssignmentResources";
import { refetchTripTrackingViews } from "../tracking/syncTripDetailFromTimeline";

/**
 * Hook para iniciar viaje
 */
export function useStartTrip(
  options?: UseMutationOptions<
    Trip,
    Error,
    {
      id: string;
      mileage?: number;
      latitude?: number;
      longitude?: number;
      occurredAt?: string;
      idempotencyKey?: string;
    }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mileage, latitude, longitude, occurredAt, idempotencyKey }) => {
      if (mileage === undefined) {
        throw new Error(
          "El kilometraje inicial es requerido para iniciar el viaje.",
        );
      }

      await trackingRepository.startTrip(id, {
        mileage,
        latitude,
        longitude,
        occurredAt,
        idempotencyKey,
      });

      const trip = await tripRepository.findById(id);
      if (!trip) {
        throw new Error("No se pudo recargar el viaje despues de iniciar.");
      }
      return trip.data;
    },
    ...options,
    onSuccess: async (trip, variables, onMutateResult, context) => {
      queryClient.setQueryData(tripQueryKeys.detail(trip.id), trip);
      await refetchTripTrackingViews(queryClient, trip.id, {
        status: TripStatus.IN_PROGRESS,
        mileageStart: variables.mileage ?? trip.mileage.start,
        actualDeparture: trip.actualDeparture,
      });
      await invalidateTripAssignmentResources(queryClient);
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      options?.onSuccess?.(trip, variables, onMutateResult, context);
    },
  });
}
