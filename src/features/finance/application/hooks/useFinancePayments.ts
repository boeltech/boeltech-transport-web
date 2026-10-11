import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Query, UseMutationOptions } from "@tanstack/react-query";
import {
  financePaymentsApi,
  OPEN_PPD_INVOICES_PAGE_SIZE,
  type CobrosApiBucket,
  type RegisterFinancePaymentPayload,
} from "@features/finance/infrastructure/financePaymentsApi";
import type { FinancePayment, FinanceRepStatusItem } from "@features/finance/domain";
import { isRepStatusTerminal } from "@features/finance/domain";
import { devRefetchIntervalFn } from "@shared/config/devPolling";
import { financeQueryKeys } from "./useFinance";

export { OPEN_PPD_INVOICES_PAGE_SIZE };

const REP_STATUS_POLL_MS = 4_000;

/** Paridad con `invoiceQueryKeys` (evita import circular finance ↔ invoicing). */
const invoiceInvalidationKeys = {
  lists: () => ["invoices", "list"] as const,
  detail: (id: string) => ["invoices", "detail", id] as const,
};

function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === "undefined"
      ? true
      : document.visibilityState !== "hidden",
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onChange = () => {
      setVisible(document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return visible;
}

export function useOpenPpdInvoices(options?: {
  receiverRfc?: string | null;
  search?: string | null;
  cobrosBucket?: CobrosApiBucket | null;
  enabled?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? OPEN_PPD_INVOICES_PAGE_SIZE;
  const receiverRfc = options?.receiverRfc ?? null;
  const search = options?.search ?? null;
  const cobrosBucket = options?.cobrosBucket ?? null;
  return useQuery({
    queryKey: financeQueryKeys.openPpdInvoices({
      receiverRfc,
      search,
      cobrosBucket,
      page,
      limit,
    }),
    queryFn: () =>
      financePaymentsApi.getOpenPpdInvoices({
        receiverRfc,
        search,
        cobrosBucket,
        page,
        limit,
      }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    placeholderData: (previous, previousQuery) => {
      const prevKey = previousQuery?.queryKey;
      if (!prevKey || prevKey[1] !== "open-ppd") return undefined;
      const prevFilters = prevKey[2] as {
        receiverRfc?: string | null;
        search?: string | null;
        cobrosBucket?: CobrosApiBucket | null;
      };
      if (
        prevFilters?.receiverRfc === receiverRfc &&
        prevFilters?.search === search &&
        prevFilters?.cobrosBucket === cobrosBucket
      ) {
        return previous;
      }
      return undefined;
    },
  });
}

export function useOpenPpdSummary(options?: {
  receiverRfc?: string | null;
  search?: string | null;
  enabled?: boolean;
}) {
  const receiverRfc = options?.receiverRfc ?? null;
  const search = options?.search ?? null;
  return useQuery({
    queryKey: financeQueryKeys.openPpdSummary(receiverRfc, search),
    queryFn: () =>
      financePaymentsApi.getOpenPpdSummary({
        receiverRfc,
        search,
      }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
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

export function useRepStatusByIds(
  paymentIds: readonly string[],
  options?: { enabled?: boolean },
) {
  const visible = useDocumentVisible();
  const ids = useMemo(() => {
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const id of paymentIds) {
      const trimmed = id.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      unique.push(trimmed);
      if (unique.length >= 50) break;
    }
    return unique;
  }, [paymentIds]);

  const idsKey = ids.join(",");
  const enabled = (options?.enabled ?? true) && ids.length > 0;

  return useQuery({
    queryKey: financeQueryKeys.repStatusByIds(idsKey),
    queryFn: () => financePaymentsApi.getRepStatusByIds(ids),
    enabled,
    staleTime: 0,
    refetchInterval: !visible
      ? false
      : devRefetchIntervalFn((query: Query<FinanceRepStatusItem[], Error>) => {
          const items = query.state.data;
          if (!items || items.length === 0) return REP_STATUS_POLL_MS;
          const allTerminal = items.every((item) =>
            isRepStatusTerminal(item.repStatus),
          );
          return allTerminal ? false : REP_STATUS_POLL_MS;
        }),
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
    onSuccess: (data, variables, context, mutation) => {
      // Fire-and-forget: do not block sheet close / tray paint on invalidate.
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      void queryClient.invalidateQueries({
        queryKey: invoiceInvalidationKeys.lists(),
      });
      for (const allocation of variables.allocations) {
        void queryClient.invalidateQueries({
          queryKey: invoiceInvalidationKeys.detail(allocation.ingressInvoiceId),
        });
      }
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useRetryFinanceRepStamp(
  options?: Omit<
    UseMutationOptions<
      unknown,
      Error,
      { invoiceId: string; paymentId: string }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invoiceId,
      paymentId,
    }: {
      invoiceId: string;
      paymentId: string;
    }) => financePaymentsApi.retryRepStamp(invoiceId, paymentId),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      void queryClient.invalidateQueries({
        queryKey: invoiceInvalidationKeys.detail(variables.invoiceId),
      });
      void queryClient.invalidateQueries({
        queryKey: invoiceInvalidationKeys.lists(),
      });
      void queryClient.invalidateQueries({ queryKey: financeQueryKeys.all });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
