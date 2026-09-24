import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { tripQueryKeys, type Trip } from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

export type PatchTripOperationalCashInput = {
  amount: number;
  /** ISO 8601 con offset; si se omite, el API usa now UTC. */
  collectedAt?: string;
  note?: string;
};

export function usePatchTripOperationalCash(
  tripId: string,
  options?: UseMutationOptions<Trip, Error, PatchTripOperationalCashInput>,
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
    mutationFn: (input: PatchTripOperationalCashInput) =>
      tripsApi.patchOperationalCash(tripId, input),
    onSuccess: async (trip, variables, onMutateResult, context) => {
      queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) => {
        if (!previous) return trip;
        return {
          ...previous,
          ...trip,
          costs: trip.costs ?? previous.costs,
          operationalCashCollectedAt:
            trip.operationalCashCollectedAt ?? previous.operationalCashCollectedAt,
          operationalCashAmount:
            trip.operationalCashAmount ?? previous.operationalCashAmount,
          operationalCashNote:
            trip.operationalCashNote ?? previous.operationalCashNote,
        };
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      });
      await queryClient.invalidateQueries({
        queryKey: tripQueryKeys.lists(),
      });
      await userOnSuccess?.(trip, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
