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
    onSuccess: (trip) => {
      // Actualizar el detalle del viaje en cache
      queryClient.setQueryData(tripQueryKeys.detail(trip.id), trip);
      // Invalidar todas las listas para forzar refetch
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
    },
    ...options,
  });
}
