import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { invalidateDashboardLiveQueries } from "@features/dashboard/application/invalidateDashboardLiveQueries";
import { settlementsQueryKeys } from "@features/settlements/application/settlementsQueryKeys";
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
      // startTrip may freeze CP31 fleet snapshot — refresh card without waiting staleTime.
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.fleetSnapshot(trip.id),
      });
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.opsDaySummary(),
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: [...tripQueryKeys.all, "invoiceable-summary"],
        refetchType: "active",
      });
      invalidateDashboardLiveQueries(queryClient);
      // F7: inicio de viaje afecta readiness de liquidaciones (viajes del periodo)
      void queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.workbench(),
        refetchType: "active",
      });
      options?.onSuccess?.(trip, variables, onMutateResult, context);
    },
  });
}
