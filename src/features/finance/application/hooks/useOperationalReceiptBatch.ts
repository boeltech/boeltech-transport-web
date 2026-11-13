import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";

import type {
  CreateOperationalReceiptBatchInput,
  OperationalReceiptBatchDetail,
  VoidOperationalReceiptBatchInput,
} from "@features/finance/domain/operationalReceiptBatch";
import { operationalReceiptBatchApi } from "@features/finance/infrastructure/operationalReceiptBatchApi";
import { clientQueryKeys } from "@features/clients/domain";
import { tripQueryKeys } from "@features/trips/domain";
import { financeQueryKeys } from "../financeQueryKeys";

export async function invalidateOperationalReceiptBatchSurface(
  queryClient: QueryClient,
  opts: { clientId?: string | null; tripIds?: string[] },
) {
  const tasks: Promise<unknown>[] = [
    queryClient.invalidateQueries({
      queryKey: financeQueryKeys.operationalReceiptBatchesRoot(),
    }),
    queryClient.invalidateQueries({
      queryKey: financeQueryKeys.operationalCashPendingRoot(),
    }),
  ];
  if (opts.clientId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: [
          ...clientQueryKeys.detail(opts.clientId),
          "credit-summary",
        ],
      }),
    );
  }
  for (const tripId of opts.tripIds ?? []) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.detail(tripId),
      }),
      queryClient.invalidateQueries({
        queryKey: tripQueryKeys.operationalCashReceipts(tripId),
      }),
    );
  }
  tasks.push(
    queryClient.invalidateQueries({
      queryKey: tripQueryKeys.lists(),
    }),
  );
  await Promise.all(tasks);
}

export function useOperationalReceiptBatchCandidates(
  clientId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: financeQueryKeys.operationalReceiptBatchCandidates(
      clientId ?? "",
    ),
    queryFn: () => operationalReceiptBatchApi.getCandidates(clientId!),
    enabled: (options?.enabled ?? true) && Boolean(clientId),
    staleTime: 15_000,
  });
}

export function useOperationalReceiptBatch(
  batchId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: financeQueryKeys.operationalReceiptBatch(batchId ?? ""),
    queryFn: () => operationalReceiptBatchApi.getById(batchId!),
    enabled: (options?.enabled ?? true) && Boolean(batchId),
    staleTime: 15_000,
  });
}

export function useClientOperationalReceiptBatches(
  clientId: string | undefined,
  params?: { page?: number; limit?: number; includeVoided?: boolean },
  options?: { enabled?: boolean },
) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const includeVoided = params?.includeVoided ?? true;
  return useQuery({
    queryKey: financeQueryKeys.clientOperationalReceiptBatches(clientId ?? "", {
      page,
      limit,
      includeVoided,
    }),
    queryFn: () =>
      operationalReceiptBatchApi.listByClient(clientId!, {
        page,
        limit,
        includeVoided,
      }),
    enabled: (options?.enabled ?? true) && Boolean(clientId),
    staleTime: 30_000,
  });
}

export function useCreateOperationalReceiptBatch(
  clientId: string,
  options?: UseMutationOptions<
    OperationalReceiptBatchDetail,
    Error,
    CreateOperationalReceiptBatchInput
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
    mutationFn: (input: CreateOperationalReceiptBatchInput) =>
      operationalReceiptBatchApi.create(clientId, input),
    onSuccess: async (batch, variables, onMutateResult, context) => {
      await invalidateOperationalReceiptBatchSurface(queryClient, {
        clientId,
        tripIds: batch.receipts.map((r) => r.tripId),
      });
      await userOnSuccess?.(batch, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}

export function useVoidOperationalReceiptBatch(
  options?: UseMutationOptions<
    OperationalReceiptBatchDetail,
    Error,
    { batchId: string } & VoidOperationalReceiptBatchInput
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
    mutationFn: ({
      batchId,
      reason,
    }: { batchId: string } & VoidOperationalReceiptBatchInput) =>
      operationalReceiptBatchApi.void(batchId, { reason }),
    onSuccess: async (batch, variables, onMutateResult, context) => {
      await invalidateOperationalReceiptBatchSurface(queryClient, {
        clientId: batch.clientId,
        tripIds: batch.receipts.map((r) => r.tripId),
      });
      await userOnSuccess?.(batch, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      userOnError?.(error, variables, onMutateResult, context);
    },
    onSettled: (data, error, variables, onMutateResult, context) => {
      userOnSettled?.(data, error, variables, onMutateResult, context);
    },
  });
}
