import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Query, QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { clientQueryKeys } from "@features/clients/domain";
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

/**
 * Semáforo crédito (H-U06-Q01): el payload de cobro no trae clientId;
 * se resuelve desde open-ppd en caché (filtro clientId) o listados de facturas.
 */
function invalidateCreditSummariesForPaidInvoices(
  queryClient: QueryClient,
  invoiceIds: string[],
): void {
  const wanted = new Set(invoiceIds.filter(Boolean));
  if (wanted.size === 0) return;

  const clientIds = new Set<string>();

  for (const [key, data] of queryClient.getQueriesData<{
    data?: Array<{ id?: string }>;
  }>({ queryKey: financeQueryKeys.all })) {
    if (key[1] !== "open-ppd") continue;
    const filters = key[2] as { clientId?: string | null } | undefined;
    if (!filters?.clientId) continue;
    if (data?.data?.some((inv) => inv?.id && wanted.has(inv.id))) {
      clientIds.add(filters.clientId);
    }
  }

  for (const [, data] of queryClient.getQueriesData<{
    data?: Array<{ id?: string; clientId?: string | null }>;
  }>({ queryKey: invoiceInvalidationKeys.lists() })) {
    for (const row of data?.data ?? []) {
      if (row?.id && wanted.has(row.id) && row.clientId) {
        clientIds.add(row.clientId);
      }
    }
  }

  if (clientIds.size === 0) {
    void queryClient.invalidateQueries({
      queryKey: clientQueryKeys.details(),
    });
    return;
  }
  for (const clientId of clientIds) {
    void queryClient.invalidateQueries({
      queryKey: clientQueryKeys.detail(clientId),
    });
  }
}

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
  clientId?: string | null;
  receiverRfc?: string | null;
  search?: string | null;
  cobrosBucket?: CobrosApiBucket | null;
  enabled?: boolean;
  page?: number;
  limit?: number;
}) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? OPEN_PPD_INVOICES_PAGE_SIZE;
  const clientId = options?.clientId ?? null;
  const receiverRfc = options?.receiverRfc ?? null;
  const search = options?.search ?? null;
  const cobrosBucket = options?.cobrosBucket ?? null;
  return useQuery({
    queryKey: financeQueryKeys.openPpdInvoices({
      clientId,
      receiverRfc,
      search,
      cobrosBucket,
      page,
      limit,
    }),
    queryFn: () =>
      financePaymentsApi.getOpenPpdInvoices({
        clientId,
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
        clientId?: string | null;
        receiverRfc?: string | null;
        search?: string | null;
        cobrosBucket?: CobrosApiBucket | null;
      };
      if (
        prevFilters?.clientId === clientId &&
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
      const paidInvoiceIds = variables.allocations.map(
        (allocation) => allocation.ingressInvoiceId,
      );
      for (const invoiceId of paidInvoiceIds) {
        void queryClient.invalidateQueries({
          queryKey: invoiceInvalidationKeys.detail(invoiceId),
        });
      }
      invalidateCreditSummariesForPaidInvoices(queryClient, paidInvoiceIds);
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
