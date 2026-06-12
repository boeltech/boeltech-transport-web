import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type Trip,
  type TripStatusType,
} from "@features/trips/domain";
import { createUpdateTripStatusUseCase } from "@features/trips/application";
import { tripRepository } from "@features/trips/infrastructure";
import { invalidateTripAssignmentResources } from "./invalidateTripAssignmentResources";

type UpdateTripStatusVariables = { id: string; status: TripStatusType };
type UpdateTripStatusContext = { previous: Trip | undefined };

/**
 * Hook para actualizar estado del viaje (optimistic update en detalle).
 */
export function useUpdateTripStatus(
  options?: Omit<
    UseMutationOptions<
      Trip,
      Error,
      UpdateTripStatusVariables,
      UpdateTripStatusContext
    >,
    "mutationFn" | "onMutate"
  >,
) {
  const queryClient = useQueryClient();
  const updateStatusUseCase = createUpdateTripStatusUseCase(tripRepository);

  const {
    onError: userOnError,
    onSettled: userOnSettled,
    onSuccess: userOnSuccess,
    ...rest
  } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: async ({ id, status }: UpdateTripStatusVariables) => {
      const result = await updateStatusUseCase.execute(id, { status });
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onMutate: async ({
      id,
      status,
    }): Promise<UpdateTripStatusContext> => {
      await queryClient.cancelQueries({ queryKey: tripQueryKeys.detail(id) });
      const previous = queryClient.getQueryData<Trip>(tripQueryKeys.detail(id));

      if (previous) {
        queryClient.setQueryData<Trip>(tripQueryKeys.detail(id), {
          ...previous,
          status,
        });
      }

      return { previous };
    },
    onError: (err, variables, context, mutation) => {
      if (context?.previous) {
        queryClient.setQueryData(
          tripQueryKeys.detail(variables.id),
          context.previous,
        );
      }
      userOnError?.(err, variables, context, mutation);
    },
    onSettled: async (data, err, variables, context, mutation) => {
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(variables.id),
      });
      await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      await invalidateTripAssignmentResources(queryClient);
      userOnSettled?.(data, err, variables, context, mutation);
    },
    onSuccess: (data, variables, onMutateResult, context) => {
      userOnSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
