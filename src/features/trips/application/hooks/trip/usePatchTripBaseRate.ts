import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  invalidateFinanceAnalysisQueries,
  scheduleFinanceAnalysisRefresh,
} from "@features/finance/application/invalidateFinanceAnalysisQueries";
import { clientQueryKeys } from "@features/clients/domain";
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
      await queryClient.invalidateQueries({
        queryKey: [...tripQueryKeys.all, "invoiceable-summary"],
        refetchType: "active",
      });
      // H-U04-Q02: ficha cliente (historial / summary) tras cambio de monto.
      const clientId = trip.clientId ?? trip.client?.id;
      if (clientId) {
        await queryClient.invalidateQueries({
          queryKey: clientQueryKeys.detail(clientId),
          refetchType: "active",
        });
      }
      // Q03: tarifa base → Análisis inmediato + reinvalidación MV ~70 s.
      invalidateFinanceAnalysisQueries(queryClient);
      scheduleFinanceAnalysisRefresh(queryClient);
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
