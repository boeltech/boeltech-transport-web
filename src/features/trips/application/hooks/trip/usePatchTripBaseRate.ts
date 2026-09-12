import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripQueryKeys, type Trip } from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

export function usePatchTripBaseRate(
  tripId: string,
  options?: UseMutationOptions<Trip, Error, number>,
) {
  const queryClient = useQueryClient();
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
    ...rest
  } = options ?? {};

  return useMutation({
    ...rest,
    retry: 0,
    mutationFn: (baseRate: number) => tripsApi.patchBaseRate(tripId, baseRate),
    onSuccess: async (trip, baseRate, onMutateResult, context) => {
      queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
        if (!previous) return trip;
        return {
          ...previous,
          ...trip,
          costs: trip.costs ?? previous.costs,
          requiresFiscalAttention:
            trip.requiresFiscalAttention ?? previous.requiresFiscalAttention,
        };
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.lists(),
      });
      await userOnSuccess?.(trip, baseRate, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
