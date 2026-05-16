/**
 * Invoicing React Query Hooks
 * Clean Architecture - Application Layer
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { invoicingApi } from "@features/invoicing/infrastructure";
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
  finance: ["finance"] as const,
  summary: () => [...invoiceQueryKeys.finance, "summary"] as const,
  statement: () => [...invoiceQueryKeys.finance, "statement"] as const,
  prefill: (tripId: string) =>
    [...invoiceQueryKeys.finance, "prefill", tripId] as const,
};
const invoicePrefillQueriesKey = [...invoiceQueryKeys.finance, "prefill"] as const;

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

export const useFinanceSummary = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: invoiceQueryKeys.summary(),
    queryFn: () => invoicingApi.getFinanceSummary(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
};

export const useAccountStatement = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: invoiceQueryKeys.statement(),
    queryFn: () => invoicingApi.getAccountStatement(),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
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
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
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
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
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
    onSuccess: (data, variables, context, mutation) => {
      queryClient.setQueryData(invoiceQueryKeys.detail(variables), data);
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.summary() });
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
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.summary() });
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
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.summary() });
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
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.replacement.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.summary() });
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
 * Evita imports directos de infraestructura en presentation.
 */
export function downloadInvoiceXml(xmlContent: string, serieFolio: string): void {
  invoicingApi.downloadXml(xmlContent, serieFolio);
}

