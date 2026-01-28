import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Trip } from "@features/trips/domain";
import { createStartTripUseCase } from "@features/trips/application";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const tripRepository = createTripRepository();

/**
 * Hook para iniciar viaje
 */
export function useStartTrip(
  options?: UseMutationOptions<Trip, Error, string>,
) {
  const queryClient = useQueryClient();
  const startTripUseCase = createStartTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await startTripUseCase.execute(id);
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
