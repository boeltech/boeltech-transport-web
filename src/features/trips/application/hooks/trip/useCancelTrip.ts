import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripQueryKeys, type Trip } from "@features/trips/domain";
import { createCancelTripUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";

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
    onSuccess: (trip, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(trip.id) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      options?.onSuccess?.(trip, variables, onMutateResult, context);
    },
  });
}
