import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { TripStop } from "@features/trips/domain";
import { createGetStopsUseCase } from "@features/trips/application";
import { createStopRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const stopRepository = createStopRepository();

/**
 * Hook para obtener destinos de un viaje
 */
export function useTripStops(
  tripId: string,
  options?: Omit<UseQueryOptions<TripStop[]>, "queryKey" | "queryFn">,
) {
  const getStopsUseCase = createGetStopsUseCase(stopRepository);

  return useQuery({
    queryKey: tripQueryKeys.stops(tripId),
    queryFn: async () => {
      const result = await getStopsUseCase.execute(tripId);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!tripId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}
