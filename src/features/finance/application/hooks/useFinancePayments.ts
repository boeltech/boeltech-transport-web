import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import {
  financePaymentsApi,
  type RegisterFinancePaymentPayload,
} from "@features/finance/infrastructure/financePaymentsApi";
import { financeQueryKeys } from "./useFinance";
import type { FinancePayment } from "@features/finance/domain";

const invoiceInvalidationKeys = {
  lists: () => ["invoices", "list"] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

export function useOpenPpdInvoices(
  receiverRfc: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...financeQueryKeys.all, "open-ppd", receiverRfc] as const,
    queryFn: () => financePaymentsApi.getOpenPpdInvoices(receiverRfc!),
    enabled: Boolean(receiverRfc) && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useRegisterFinancePayment(
  options?: Omit<
    UseMutationOptions<FinancePayment, Error, RegisterFinancePaymentPayload>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterFinancePaymentPayload) =>
      financePaymentsApi.registerPayment(payload),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      await queryClient.invalidateQueries({
        queryKey: invoiceInvalidationKeys.lists(),
      });
      for (const allocation of variables.allocations) {
        queryClient.invalidateQueries({
          queryKey: invoiceInvalidationKeys.detail(allocation.ingressInvoiceId),
        });
      }
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
