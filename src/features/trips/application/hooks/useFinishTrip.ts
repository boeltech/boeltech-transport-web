import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Trip } from "@features/trips/domain";
import {
  createFinishTripUseCase,
  type FinishTripInput,
} from "@features/trips/application";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const tripRepository = createTripRepository();

/**
 * Hook para finalizar viaje
 */
export function useFinishTrip(
  options?: UseMutationOptions<
    Trip,
    Error,
    { id: string; data: FinishTripInput }
  >,
) {
  const queryClient = useQueryClient();
  const finishTripUseCase = createFinishTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await finishTripUseCase.execute(id, data);
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
