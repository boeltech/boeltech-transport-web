import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  tripQueryKeys,
  type OperationalCashReceipt,
} from "@features/trips/domain";
import { tripsApi } from "@features/trips/infrastructure/api/tripsApi";

export type CreateOperationalCashReceiptInput = {
  amount: number;
  /** ISO 8601 con offset; si se omite, el API usa now UTC. */
  collectedAt?: string;
  note?: string;
};

async function invalidateOperationalCashSurface(
  queryClient: QueryClient,
  tripId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.detail(tripId),
    }),
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.operationalCashReceipts(tripId),
    }),
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.lists(),
    }),
  ]);
}

export function useCreateOperationalCashReceipt(
  tripId: string,
  options?: UseMutationOptions<
    OperationalCashReceipt,
    Error,
    CreateOperationalCashReceiptInput
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
    mutationFn: (input: CreateOperationalCashReceiptInput) =>
      tripsApi.createOperationalCashReceipt(tripId, input),
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
