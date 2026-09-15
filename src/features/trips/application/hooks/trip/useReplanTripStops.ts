import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import {
  tripQueryKeys,
  type ReplanPendingStopInput,
  type TrackingTimeline,
  type Trip,
} from "@features/trips/domain";

import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

export type { ReplanPendingStopInput };

async function invalidateTripAfterStopsMutation(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.detail(tripId),
    }),
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.cargos(tripId),
    }),
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.timeline(tripId),
    }),
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.lists(),
    }),
  ]);
}

/** ADR-0093 E1 — PUT …/stops:replan (pending insert/modify/delete/reorder). */
export function useReplanTripStops(
  tripId: string,
  options?: UseMutationOptions<Trip, Error, ReplanPendingStopInput[]>,
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
    mutationFn: (pendingStops: ReplanPendingStopInput[]) =>
      tripsApi.replanStops(tripId, pendingStops),
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
        if (!previous) return data;
        return {
          ...previous,
          ...data,
          stops: data.stops ?? previous.stops,
          requiresFiscalAttention:
            data.requiresFiscalAttention ?? previous.requiresFiscalAttention,
        };
      });
      // Tab Ruta lee timeline.stops cuando status coincide — parchear antes del refetch.
      if (data.stops) {
        queryClient.setQueryData<TrackingTimeline>(
          tripQueryKeys.timeline(tripId),
          (previous) => {
            if (!previous) return previous;
            return { ...previous, stops: data.stops! };
          },
        );
      }
      await invalidateTripAfterStopsMutation(queryClient, tripId);
      await userOnSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
