import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripQueryKeys, type Trip } from "@features/trips/domain";
import { tripRepository, trackingRepository } from "@features/trips/infrastructure";

/**
 * Hook para iniciar viaje
 */
export function useStartTrip(
  options?: UseMutationOptions<
    Trip,
    Error,
    { id: string; mileage?: number; latitude?: number; longitude?: number }
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mileage, latitude, longitude }) => {
      if (mileage === undefined) {
        throw new Error(
          "El kilometraje inicial es requerido para iniciar el viaje.",
        );
      }

      await trackingRepository.startTrip(id, {
        mileage,
        latitude,
        longitude,
      });

      const trip = await tripRepository.findById(id);
      if (!trip) {
        throw new Error("No se pudo recargar el viaje despues de iniciar.");
      }
      return trip.data;
    },
    ...options,
    onSuccess: (trip, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(trip.id) });
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.timeline(trip.id),
      });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      options?.onSuccess?.(trip, variables, onMutateResult, context);
    },
  });
}
