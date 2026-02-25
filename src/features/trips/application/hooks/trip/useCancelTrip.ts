import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Trip } from "@features/trips/domain";
import { createCancelTripUseCase } from "@features/trips/application";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const tripRepository = createTripRepository();

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
    onSuccess: (trip) => {
      queryClient.setQueryData(tripQueryKeys.detail(trip.id), trip);
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
    },
    ...options,
  });
}
