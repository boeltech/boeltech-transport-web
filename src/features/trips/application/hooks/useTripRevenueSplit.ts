/**
 * React Query hooks for trip revenue split (ADR-0081).
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type TripRevenueSplit,
  type UpsertTripRevenueSplitInput,
} from "@features/trips/domain";
import { tripRevenueSplitApi } from "@features/trips/infrastructure/tripRevenueSplitApi";

async function invalidateSplitCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  tripId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.revenueSplit(tripId),
    }),
    queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) }),
    queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() }),
  ]);
}

export function useTripRevenueSplit(
  tripId: string,
  options?: Omit<
    UseQueryOptions<TripRevenueSplit | null>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: tripQueryKeys.revenueSplit(tripId),
    queryFn: () => tripRevenueSplitApi.get(tripId),
    enabled: !!tripId,
    staleTime: 30_000,
    ...options,
  });
}

export function useUpsertTripRevenueSplit(
  tripId: string,
  options?: Omit<
    UseMutationOptions<TripRevenueSplit, Error, UpsertTripRevenueSplitInput>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertTripRevenueSplitInput) =>
      tripRevenueSplitApi.upsert(tripId, input),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await invalidateSplitCaches(queryClient, tripId);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useDeleteTripRevenueSplit(
  tripId: string,
  options?: Omit<
    UseMutationOptions<TripRevenueSplit | null, Error, void>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => tripRevenueSplitApi.remove(tripId),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await invalidateSplitCaches(queryClient, tripId);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
