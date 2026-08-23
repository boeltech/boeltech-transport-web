import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { TripStatus, type Trip } from "@features/trips/domain";
import { createCancelTripUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";
import { invalidateTripAssignmentResources } from "./invalidateTripAssignmentResources";
import { invalidateTripDetailSurface } from "./invalidateTripDetailSurface";

/**
 * Hook para cancelar viaje
 */
export function useCancelTrip(
  options?: UseMutationOptions<Trip, Error, { id: string; reason?: string }>,
) {
  const queryClient = useQueryClient();
  const cancelTripUseCase = createCancelTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const result = await cancelTripUseCase.execute(id, reason);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    ...options,
    onSuccess: async (trip, variables, onMutateResult, context) => {
      await invalidateTripDetailSurface(queryClient, trip.id, {
        status: TripStatus.CANCELLED,
      });
      await invalidateTripAssignmentResources(queryClient);
      options?.onSuccess?.(trip, variables, onMutateResult, context);
    },
  });
}
