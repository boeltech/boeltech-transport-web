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

async function invalidateTripAfterStopsMutation(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
) {
  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.detail(tripId),
  });
  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.cargos(tripId),
  });
  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.timeline(tripId),
  });
  await queryClient.invalidateQueries({
    queryKey: tripQueryKeys.lists(),
  });
}

/**
 * ADR-0093 — append-only mid-trip.
 * @deprecated E1 — path de producto mid-trip = {@link useReplanTripStops}.
 * No invocar desde Tab Ruta.
 */
export function useAppendTripStops(
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
      tripsApi.appendStops(tripId, stops),
    onSuccess: async (trip, stops, onMutateResult, context) => {
      queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
        if (!previous) return trip;
        return {
          ...previous,
          ...trip,
          stops: trip.stops ?? previous.stops,
          requiresFiscalAttention:
            trip.requiresFiscalAttention ?? previous.requiresFiscalAttention,
        };
      });
      await invalidateTripAfterStopsMutation(queryClient, tripId);
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
