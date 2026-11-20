import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { type OperationalCashReceipt } from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

import { invalidateOperationalCashSurface } from "./useCreateOperationalCashReceipt";

export type VoidOperationalCashReceiptInput = {
  receiptId: string;
  reason: string;
};

export function useVoidOperationalCashReceipt(
  tripId: string,
  options?: UseMutationOptions<
    OperationalCashReceipt,
    Error,
    VoidOperationalCashReceiptInput
  >,
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
    mutationFn: (input: VoidOperationalCashReceiptInput) =>
      tripsApi.voidOperationalCashReceipt(tripId, input.receiptId, {
        reason: input.reason,
      }),
    onSuccess: async (receipt, variables, onMutateResult, context) => {
      await invalidateOperationalCashSurface(queryClient, tripId);
      await userOnSuccess?.(receipt, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
