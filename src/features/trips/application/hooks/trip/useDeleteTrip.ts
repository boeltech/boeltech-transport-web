import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createDeleteTripUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain";
/**
 * Hook para eliminar viaje
 */
export function useDeleteTrip(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();
  const deleteTripUseCase = createDeleteTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTripUseCase.execute(id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: tripQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
    },
    ...options,
  });
}
