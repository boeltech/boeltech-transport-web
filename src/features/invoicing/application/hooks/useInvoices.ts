/**
 * Invoicing React Query Hooks
 * Clean Architecture - Application Layer
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type Query,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { devRefetchIntervalFn } from "@/shared/config/devPolling";
import { invoicingApi } from "@features/invoicing/infrastructure";
import { tripQueryKeys } from "@features/trips/domain";
import type {
  Invoice,
  Payment,
  InvoiceFilters,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreatePaymentPayload,
  SubstituteStampedInvoicePayload,
  SubstituteStampedInvoiceResult,
} from "@features/invoicing/domain";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const invoiceQueryKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceQueryKeys.all, "list"] as const,
  list: (filters?: InvoiceFilters) =>
    [...invoiceQueryKeys.lists(), filters] as const,
  details: () => [...invoiceQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceQueryKeys.details(), id] as const,
  payments: (id: string) =>
    [...invoiceQueryKeys.detail(id), "payments"] as const,
  prefill: (tripId: string) =>
    [...invoiceQueryKeys.all, "prefill", tripId] as const,
};
const invoicePrefillQueriesKey = [...invoiceQueryKeys.all, "prefill"] as const;
/** Cross-feature invalidation key (finance module owns queries under this root). */
const financeQueryRoot = ["finance"] as const;

async function invalidateAndRefetchFinance(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: financeQueryRoot });
  await queryClient.refetchQueries({
    queryKey: financeQueryRoot,
    type: "active",
  });
}

// ============================================================================
// QUERIES
// ============================================================================

export const useInvoices = (filters?: InvoiceFilters) => {
  return useQuery({
    queryKey: invoiceQueryKeys.list(filters),
    queryFn: () => invoicingApi.getAll(filters),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: invoiceQueryKeys.detail(id),
    queryFn: () => invoicingApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
    refetchInterval: devRefetchIntervalFn((query: Query<Invoice, Error>) => {
      const invoice = query.state.data;
      const hasPendingRep = invoice?.payments.some(
        (p: Payment) => p.repStatus === "pending",
      );
      return hasPendingRep ? 5_000 : false;
    }),
  });
};

export const useInvoicePayments = (invoiceId: string) => {
  return useQuery({
    queryKey: invoiceQueryKeys.payments(invoiceId),
    queryFn: () => invoicingApi.getPayments(invoiceId),
    enabled: !!invoiceId,
    staleTime: 30_000,
  });
};

export const useInvoicePrefill = (tripId: string) => {
  return useQuery({
    queryKey: invoiceQueryKeys.prefill(tripId),
    queryFn: () => invoicingApi.getPrefillFromTrip(tripId),
    enabled: !!tripId,
    staleTime: 5 * 60_000,
  });
};

// ============================================================================
// MUTATIONS
//
// Pattern: spread `...options` FIRST, then override `onSuccess` so cache
// invalidation always runs regardless of whether the caller provides onSuccess.
// The caller's onSuccess is forwarded via options?.onSuccess?.(data, vars, ctx).
// ============================================================================

export function useCreateInvoice(
  options?: Omit<
    UseMutationOptions<Invoice, Error, CreateInvoicePayload>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoicingApi.create(payload),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: financeQueryRoot });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useUpdateInvoice(
  options?: Omit<
    UseMutationOptions<
      Invoice,
      Error,
      { id: string; payload: UpdateInvoicePayload }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInvoicePayload;
    }) => invoicingApi.update(id, payload),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useDeleteInvoice(
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicingApi.delete(id),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: financeQueryRoot });
      queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useStampInvoice(
  options?: Omit<UseMutationOptions<Invoice, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicingApi.stamp(id),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.setQueryData(invoiceQueryKeys.detail(variables), data);
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.id),
      });
      await invalidateAndRefetchFinance(queryClient);
      queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useCancelInvoice(
  options?: Omit<
    UseMutationOptions<
      Invoice,
      Error,
      { id: string; payload: CancelInvoicePayload }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CancelInvoicePayload;
    }) => invoicingApi.cancel(id, payload),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.id),
      });
      await invalidateAndRefetchFinance(queryClient);
      queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useRegisterPayment(
  invoiceId: string,
  options?: Omit<
    UseMutationOptions<Payment, Error, CreatePaymentPayload>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) =>
      invoicingApi.registerPayment(invoiceId, payload),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.payments(invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: financeQueryRoot });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useRetryRepStamp(
  invoiceId: string,
  options?: Omit<
    UseMutationOptions<Payment, Error, string>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: string) =>
      invoicingApi.retryRepStamp(invoiceId, paymentId),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useSubstituteStampedInvoice(
  invoiceId: string,
  options?: Omit<
    UseMutationOptions<
      SubstituteStampedInvoiceResult,
      Error,
      SubstituteStampedInvoicePayload
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubstituteStampedInvoicePayload) =>
      invoicingApi.substituteStampedInvoice(invoiceId, payload),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.replacement.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      const tripIds = new Set(
        variables.corrections?.tripCorrections?.map((entry) => entry.tripId) ??
          [],
      );
      for (const tripId of tripIds) {
        queryClient.invalidateQueries({ queryKey: tripQueryKeys.detail(tripId) });
      }
      await invalidateAndRefetchFinance(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

// ──────────────────────────────────────────────────────────────────────────
// PDF
// ──────────────────────────────────────────────────────────────────────────

/**
 * Abre el PDF timbrado en una nueva pestaña (genera on-demand en backend).
 * isPending = true mientras Puppeteer genera el PDF (~2s primera vez).
 */
export function useOpenInvoicePdf(
  options?: Omit<
    UseMutationOptions<
      void,
      Error,
      { id: string; serieFolio: string; refreshPdf?: boolean }
    >,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({ id, serieFolio, refreshPdf }) =>
      invoicingApi.openPdf(id, serieFolio, { refresh: refreshPdf }),
    ...options,
  });
}

/**
 * Descarga XML timbrado usando la capa de aplicación.
 */
export function downloadInvoiceXml(invoiceId: string, serieFolio: string): void {
  void invoicingApi.downloadXmlById(invoiceId, serieFolio);
}

export function useDownloadInvoiceXml(
  options?: Omit<
    UseMutationOptions<void, Error, { id: string; serieFolio: string }>,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({ id, serieFolio }) => invoicingApi.downloadXmlById(id, serieFolio),
    ...options,
  });
}

