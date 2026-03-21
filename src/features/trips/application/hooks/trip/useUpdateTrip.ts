import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type Trip,
  type UpdateTripInput,
} from "@features/trips/domain";
import { createUpdateTripUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";

/**
 * Hook para actualizar viaje
 */
export function useUpdateTrip(
  options?: UseMutationOptions<
    Trip,
    Error,
    { id: string; data: UpdateTripInput }
  >,
) {
  const queryClient = useQueryClient();
  const updateTripUseCase = createUpdateTripUseCase(tripRepository);

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await updateTripUseCase.execute(id, data);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (updatedTrip, { id }) => {
      queryClient.setQueryData(tripQueryKeys.detail(id), updatedTrip);
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
    },
    ...options,
  });
}
