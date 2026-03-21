import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripQueryKeys, type TripStop } from "@features/trips/domain";
import { createMarkStopVisitedUseCase } from "@features/trips/application";
import { tripRepository, stopRepository } from "@features/trips/infrastructure";

/**
 * Hook para marcar destino como visitado
 */
export function useMarkStopVisited(
  options?: UseMutationOptions<
    TripStop,
    Error,
    { tripId: string; stopId: string }
  >,
) {
  const queryClient = useQueryClient();
  const markVisitedUseCase = createMarkStopVisitedUseCase(
    tripRepository,
    stopRepository,
  );

  return useMutation({
    mutationFn: async ({ tripId, stopId: stopId }) => {
      const result = await markVisitedUseCase.execute(tripId, stopId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.stops(tripId),
      });
    },
    ...options,
  });
}
