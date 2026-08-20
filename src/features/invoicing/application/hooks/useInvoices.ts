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
  InvoiceBillingScope,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreatePaymentPayload,
  SubstituteStampedInvoiceCorrections,
  SubstituteStampedInvoicePayload,
  SubstituteStampedInvoiceResult,
} from "@features/invoicing/domain";
import { invalidateFiscalCorrectionResources } from "../invalidateFiscalCorrectionResources";

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
  prefills: () => [...invoiceQueryKeys.all, "prefill"] as const,
  prefill: (
    tripId: string,
    scope: InvoiceBillingScope = "primary_transport",
  ) => [...invoiceQueryKeys.prefills(), tripId, scope] as const,
};

/** Prefix for every trip+scope prefill. Client fiscal edits must evict this. */
const invoicePrefillQueriesKey = invoiceQueryKeys.prefills();

/**
 * Drops cached invoice prefill (RFC, régimen, CP fiscal) after client edits.
 */
export function evictInvoicePrefillQueries(
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  queryClient.removeQueries({ queryKey: invoicePrefillQueriesKey });
}

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

function hasSubstitutionAmountCorrections(
  corrections?: SubstituteStampedInvoiceCorrections,
): boolean {
  if (!corrections) {
    return false;
  }
  return (
    corrections.subtotal !== undefined ||
    corrections.discount !== undefined ||
    corrections.totalTax !== undefined ||
    corrections.retainedTax !== undefined ||
    corrections.total !== undefined
  );
}

function collectSubstitutionAffectedTripIds(
  data: SubstituteStampedInvoiceResult,
  variables: SubstituteStampedInvoicePayload,
): string[] {
  const ids = new Set<string>();
  for (const entry of variables.corrections?.tripCorrections ?? []) {
    if (entry.tripId) {
      ids.add(entry.tripId);
    }
  }
  for (const trip of data.replacement.trips) {
    ids.add(trip.tripId);
  }
  for (const trip of data.original.trips) {
    ids.add(trip.tripId);
  }
  return [...ids];
}

async function invalidateSubstitutionTripCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  tripIds: string[],
  amountCorrections: boolean,
): Promise<void> {
  if (tripIds.length === 0 && !amountCorrections) {
    return;
  }

  queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
  queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });

  for (const tripId of tripIds) {
    await queryClient.invalidateQueries({
      queryKey: tripQueryKeys.detail(tripId),
    });
  }

  if (amountCorrections) {
    queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
  }
}

function collectInvoiceLinkedTripIds(invoice: Invoice): string[] {
  return [
    ...new Set(
      invoice.trips.map((trip) => trip.tripId).filter((tripId) => Boolean(tripId)),
    ),
  ];
}

async function invalidateInvoiceLinkedTripCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  invoice: Invoice,
): Promise<void> {
  await invalidateSubstitutionTripCaches(
    queryClient,
    collectInvoiceLinkedTripIds(invoice),
    false,
  );
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

export type UseInvoiceOptions = {
  /** When true, skip REP status polling (e.g. while an overlay is open). */
  pausePolling?: boolean;
};

export const useInvoice = (id: string, options?: UseInvoiceOptions) => {
  const pausePolling = options?.pausePolling === true;
  return useQuery({
    queryKey: invoiceQueryKeys.detail(id),
    queryFn: () => invoicingApi.getById(id),
    enabled: !!id,
    staleTime: 30_000,
    refetchInterval: pausePolling
      ? false
      : devRefetchIntervalFn((query: Query<Invoice, Error>) => {
          const invoice = query.state.data;
          const hasPendingRep = invoice?.payments.some(
            (p: Payment) =>
              p.repStatus === "pending" ||
              p.repStatus === "failed" ||
              p.repStatus === "restamp_pending" ||
              p.repStatus === "cancelling",
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

export const useInvoicePrefill = (
  tripId: string,
  scope: InvoiceBillingScope = "primary_transport",
) => {
  return useQuery({
    queryKey: invoiceQueryKeys.prefill(tripId, scope),
    queryFn: () => invoicingApi.getPrefillFromTrip(tripId, scope),
    enabled: !!tripId,
    staleTime: 30_000,
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
      await invalidateInvoiceLinkedTripCaches(queryClient, data);
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
      await invalidateInvoiceLinkedTripCaches(queryClient, data);
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
      const amountCorrections = hasSubstitutionAmountCorrections(
        variables.corrections,
      );
      await invalidateSubstitutionTripCaches(
        queryClient,
        collectSubstitutionAffectedTripIds(data, variables),
        amountCorrections,
      );
      await invalidateFiscalCorrectionResources(
        queryClient,
        variables.corrections?.tripCorrections,
      );
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

export function downloadRepXml(
  invoiceId: string,
  paymentId: string,
  filename: string,
): void {
  void invoicingApi.downloadRepXmlById(invoiceId, paymentId, filename);
}

export function useOpenRepPdf(
  options?: Omit<
    UseMutationOptions<
      void,
      Error,
      { invoiceId: string; paymentId: string; filename: string }
    >,
    "mutationFn"
  >,
) {
  return useMutation({
    mutationFn: ({ invoiceId, paymentId, filename }) =>
      invoicingApi.openRepPdf(invoiceId, paymentId, filename),
    ...options,
  });
}

