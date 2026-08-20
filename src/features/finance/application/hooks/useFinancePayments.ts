import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import {
  financePaymentsApi,
  OPEN_PPD_INVOICES_PAGE_SIZE,
  type RegisterFinancePaymentPayload,
} from "@features/finance/infrastructure/financePaymentsApi";
import { financeQueryKeys } from "./useFinance";
import type { FinancePayment } from "@features/finance/domain";

export { OPEN_PPD_INVOICES_PAGE_SIZE };

const invoiceInvalidationKeys = {
  lists: () => ["invoices", "list"] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

export function useOpenPpdInvoices(
  receiverRfc: string | null,
  options?: { enabled?: boolean; page?: number; limit?: number },
) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? OPEN_PPD_INVOICES_PAGE_SIZE;
  return useQuery({
    queryKey: [...financeQueryKeys.all, "open-ppd", receiverRfc, page, limit] as const,
    queryFn: () =>
      financePaymentsApi.getOpenPpdInvoices(receiverRfc!, page, limit),
    enabled: Boolean(receiverRfc) && (options?.enabled ?? true),
    staleTime: 30_000,
    placeholderData: (previous, previousQuery) => {
      if (previousQuery?.queryKey[2] === receiverRfc) return previous;
      return undefined;
    },
  });
}

export function useRepExceptions(options?: {
  enabled?: boolean;
  page?: number;
  limit?: number;
  receiverRfc?: string | null;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 25;
  const receiverRfc = options?.receiverRfc ?? null;
  return useQuery({
    queryKey: financeQueryKeys.repExceptions(receiverRfc, page, limit),
    queryFn: () =>
      financePaymentsApi.getRepExceptions({
        page,
        limit,
        receiverRfc,
      }),
    enabled: options?.enabled ?? true,
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
