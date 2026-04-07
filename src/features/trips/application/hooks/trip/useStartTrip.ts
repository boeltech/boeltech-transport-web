import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripQueryKeys, type Trip } from "@features/trips/domain";
import { createStartTripUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";

/**
 * Hook para iniciar viaje
 */
export function useStartTrip(
  options?: UseMutationOptions<Trip, Error, { id: string; mileage?: number }>,
) {
  const queryClient = useQueryClient();
  const startTripUseCase = createStartTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async ({ id, mileage }) => {
      const result = await startTripUseCase.execute(id, { mileage });
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    ...options,
    onSuccess: (trip, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(trip.id) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      options?.onSuccess?.(trip, variables, onMutateResult, context);
    },
  });
}
