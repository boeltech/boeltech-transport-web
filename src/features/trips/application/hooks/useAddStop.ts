import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { TripStop } from "@features/trips/domain";
import {
  createAddStopUseCase,
  type AddStopInput,
} from "@features/trips/application";
import {
  createTripRepository,
  createStopRepository,
} from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const tripRepository = createTripRepository();
const stopRepository = createStopRepository();

/**
 * Hook para agregar destino
 */
export function useAddStop(
  options?: UseMutationOptions<
    TripStop,
    Error,
    { tripId: string; data: AddStopInput }
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
