import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { Trip } from "@features/trips/domain";
import { createGetTripByIdUseCase } from "@features/trips/application";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const tripRepository = createTripRepository();

/**
 * Hook para obtener un viaje por ID
 */
export function useTrip(
  id: string,
  options?: Omit<UseQueryOptions<Trip>, "queryKey" | "queryFn">,
) {
  const getTripByIdUseCase = createGetTripByIdUseCase(tripRepository);

  return useQuery({
    queryKey: tripQueryKeys.detail(id),
    queryFn: async () => {
      const result = await getTripByIdUseCase.execute(id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}
