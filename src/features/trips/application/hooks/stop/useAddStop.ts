import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type CreateStopInput,
  type TripStop,
} from "@features/trips/domain";
import { createAddStopUseCase } from "@features/trips/application";
import { tripRepository, stopRepository } from "@features/trips/infrastructure";

/**
 * Hook para agregar destino
 */
export function useAddStop(
  options?: UseMutationOptions<
    TripStop,
    Error,
    { tripId: string; data: CreateStopInput }
  >,
) {
  const queryClient = useQueryClient();
  const addStopUseCase = createAddStopUseCase(tripRepository, stopRepository);

  return useMutation({
    mutationFn: async ({ tripId, data }) => {
      const result = await addStopUseCase.execute(tripId, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.stops(tripId),
      });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
    },
    ...options,
  });
}
