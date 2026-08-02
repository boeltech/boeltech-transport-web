import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { createDeleteTripUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain";

/**
 * Hook para eliminar viaje.
 * Fusiona callbacks del caller para no perder removeQueries / invalidate.
 */
export function useDeleteTrip(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();
  const deleteTripUseCase = createDeleteTripUseCase(tripRepository);

  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
    ...rest
  } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async (id: string) => {
      const result = await deleteTripUseCase.execute(id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
    },
    onSuccess: async (_data, id, onMutateResult, context) => {
      queryClient.removeQueries({ queryKey: tripQueryKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      await userOnSuccess?.(undefined, id, onMutateResult, context);
    },
    onError: (error, id, onMutateResult, context) => {
      userOnError?.(error, id, onMutateResult, context);
    },
    onSettled: (data, error, id, onMutateResult, context) => {
      userOnSettled?.(data, error, id, onMutateResult, context);
    },
  });
}
