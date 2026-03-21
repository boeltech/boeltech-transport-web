import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type FinishTripInput,
  type Trip,
} from "@features/trips/domain";
import { createFinishTripUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";

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
