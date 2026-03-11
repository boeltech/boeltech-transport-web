import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Trip } from "@features/trips/domain";
import {
  createUpdateTripUseCase,
  type UpdateTripInput,
} from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities/entities";

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
