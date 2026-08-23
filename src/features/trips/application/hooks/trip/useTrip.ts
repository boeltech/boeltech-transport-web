import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { tripQueryKeys, type Trip } from "@features/trips/domain";
import { createGetTripByIdUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";
import { ApiError } from "@shared/api/interceptors/error-handler";

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
        if (result.error.code === "TRIP_NOT_FOUND") {
          throw new ApiError(result.error.message, 404, result.error.code);
        }
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}
