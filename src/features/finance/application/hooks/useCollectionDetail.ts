/**
 * Hooks detalle unificado del cobro (F3).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { collectionDetailApi } from "@features/finance/infrastructure/collectionDetailApi";
import type {
  PaymentCollectionDetail,
  ReceiptCollectionDetail,
} from "@features/finance/domain/collectionDetail";
import { tripQueryKeys } from "@features/trips/domain";
import { financeQueryKeys } from "../financeQueryKeys";
import { invalidateOperationalReceiptBatchSurface } from "./useOperationalReceiptBatch";

/** Paridad con invoice keys (evita import circular finance ↔ invoicing). */
const invoiceInvalidationKeys = {
  lists: () => ["invoices", "list"] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

export function usePaymentCollectionDetail(
  paymentId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: financeQueryKeys.paymentCollectionDetail(paymentId ?? ""),
    queryFn: () => collectionDetailApi.getPaymentDetail(paymentId!),
    enabled: (options?.enabled ?? true) && Boolean(paymentId),
    staleTime: 15_000,
  });
}

export function useReceiptCollectionDetail(
  receiptId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: financeQueryKeys.receiptCollectionDetail(receiptId ?? ""),
    queryFn: () => collectionDetailApi.getReceiptDetail(receiptId!),
    enabled: (options?.enabled ?? true) && Boolean(receiptId),
    staleTime: 15_000,
  });
}

export function useRetryPaymentRep(
  options?: Omit<
    UseMutationOptions<unknown, Error, { paymentId: string }>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId }: { paymentId: string }) =>
      collectionDetailApi.retryRep(paymentId),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({
        queryKey: financeQueryKeys.paymentCollectionDetail(variables.paymentId),
      });
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: invoiceInvalidationKeys.lists(),
      });
      // H-U06-Q03: paridad con useRetryFinanceRepStamp. retryRep API → void;
      // invoiceIds desde detalle de cobro en caché (allocations).
      const cached = queryClient.getQueryData<PaymentCollectionDetail>(
        financeQueryKeys.paymentCollectionDetail(variables.paymentId),
      );
      for (const allocation of cached?.allocations ?? []) {
        if (!allocation.ingressInvoiceId) continue;
        void queryClient.invalidateQueries({
          queryKey: invoiceInvalidationKeys.detail(allocation.ingressInvoiceId),
        });
      }
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useOpenPaymentRepPdf(
  options?: Omit<
    UseMutationOptions<
      unknown,
      Error,
      { paymentId: string; filename: string }
    >,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({
      paymentId,
      filename,
    }: {
      paymentId: string;
      filename: string;
    }) => collectionDetailApi.openRepPdf(paymentId, filename),
    ...options,
  });
}

export function useDownloadPaymentRepXml(
  options?: Omit<
    UseMutationOptions<
      unknown,
      Error,
      { paymentId: string; filename: string }
    >,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({
      paymentId,
      filename,
    }: {
      paymentId: string;
      filename: string;
    }) => collectionDetailApi.downloadRepXml(paymentId, filename),
    ...options,
  });
}

export function useVoidOperationalCashReceiptFromCollection(
  options?: Omit<
    UseMutationOptions<
      unknown,
      Error,
      { tripId: string; receiptId: string; reason: string }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tripId,
      receiptId,
      reason,
    }: {
      tripId: string;
      receiptId: string;
      reason: string;
    }) => collectionDetailApi.voidReceipt(tripId, receiptId, reason),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({
        queryKey: financeQueryKeys.receiptCollectionDetail(variables.receiptId),
      });
      void queryClient.invalidateQueries({
        queryKey: financeQueryKeys.operationalCashPendingRoot(),
      });
      void invalidateOperationalReceiptBatchSurface(queryClient, {
        tripIds: [variables.tripId],
      });
      void queryClient.invalidateQueries({
        queryKey: tripQueryKeys.all,
      });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export type {
  PaymentCollectionDetail,
  ReceiptCollectionDetail,
};
