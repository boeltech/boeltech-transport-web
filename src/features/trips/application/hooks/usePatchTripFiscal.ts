import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { invoiceQueryKeys } from "@features/invoicing/application";
import {
  tripQueryKeys,
  type PatchTripFiscalPayload,
  type PatchTripFiscalResult,
} from "@features/trips/domain";
import { tripFiscalApi } from "@features/trips/infrastructure/tripFiscalApi";
import { invalidateFiscalCorrectionResources } from "@features/invoicing/application/invalidateFiscalCorrectionResources";

export function usePatchTripFiscal(
  tripId: string,
  options?: Omit<
    UseMutationOptions<PatchTripFiscalResult, Error, PatchTripFiscalPayload>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PatchTripFiscalPayload) =>
      tripFiscalApi.patch(tripId, payload),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.all });
      await invalidateFiscalCorrectionResources(queryClient, [
        {
          tripId,
          driverId: variables.driverId,
          vehicleId: variables.vehicleId,
        },
      ]);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
