import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { invoiceQueryKeys } from "@features/invoicing/application";
import {
  tripQueryKeys,
  type PatchTripStopFiscalPayload,
  type PatchTripStopFiscalResult,
} from "@features/trips/domain";
import { tripStopFiscalApi } from "@features/trips/infrastructure/tripStopFiscalApi";

export function usePatchStopFiscal(
  tripId: string,
  stopId: string,
  options?: Omit<
    UseMutationOptions<
      PatchTripStopFiscalResult,
      Error,
      PatchTripStopFiscalPayload
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatchTripStopFiscalPayload) =>
      tripStopFiscalApi.patch(tripId, stopId, payload),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.stops(tripId) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.all });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
