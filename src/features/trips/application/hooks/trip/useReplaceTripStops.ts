import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type CreateStopInput,
  type Trip,
} from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

export function useReplaceTripStops(
  tripId: string,
  options?: UseMutationOptions<Trip, Error, CreateStopInput[]>,
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
    mutationFn: (stops: CreateStopInput[]) =>
      tripsApi.replaceStops(tripId, stops),
    onSuccess: async (trip, stops, onMutateResult, context) => {
      queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
        if (!previous) return trip;
        return {
          ...previous,
          ...trip,
          stops: trip.stops ?? previous.stops,
        };
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.cargos(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.lists(),
      });
      await userOnSuccess?.(trip, stops, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
