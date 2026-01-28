import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Trip, TripStatusType } from "@features/trips/domain";
import { createUpdateTripStatusUseCase } from "@features/trips/application";
import { createTripRepository } from "@features/trips/infrastructure";
import { tripQueryKeys } from "@features/trips/domain/entities";

// ============================================================================
// REPOSITORY INSTANCES
// ============================================================================

const tripRepository = createTripRepository();

/**
 * Hook para actualizar estado
 */
/**
 * Hook para actualizar estado
 */
export function useUpdateTripStatus(
  options?: UseMutationOptions<
    Trip,
    Error,
    // { id: string; status: TripStatusType; notes?: string }
    { id: string; status: TripStatusType }
  >,
) {
  const queryClient = useQueryClient();
  const updateStatusUseCase = createUpdateTripStatusUseCase(tripRepository);

  return useMutation({
    // mutationFn: async ({ id, status, notes }) => {
    mutationFn: async ({ id, status }) => {
      // const result = await updateStatusUseCase.execute(id, status, notes);
      const result = await updateStatusUseCase.execute(id, status);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: tripQueryKeys.detail(id) });
      const previous = queryClient.getQueryData<Trip>(tripQueryKeys.detail(id));

      if (previous) {
        queryClient.setQueryData(tripQueryKeys.detail(id), {
          ...previous,
          status,
        });
      }

      return { previous };
    },
    onError: (_, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tripQueryKeys.detail(id), context.previous);
      }
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
    },
    ...options,
  });
}
