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
import { useRef } from "react";
import { devRefetchIntervalFn } from "@/shared/config/devPolling";
import { useToast } from "@shared/hooks";
import { invoicingApi } from "@features/invoicing/infrastructure";
import { clientQueryKeys } from "@features/clients/domain";
import { tripQueryKeys } from "@features/trips/application/tripsQueryKeys";
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
  SendInvoicePayload,
  SendInvoiceBatchResult,
} from "@features/invoicing/domain";
import { invoicingCopy } from "@features/invoicing/presentation/copy/invoicingCopy";
import { invoiceQueryKeys } from "../invoiceQueryKeys";
import { invalidateFiscalCorrectionResources } from "../invalidateFiscalCorrectionResources";
import { pollSendBatchUntilSettled } from "./sendBatchPoll";

export { invoiceQueryKeys };

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

/**
 * Surface viaje↔factura tras mutaciones de invoicing (C1 / H-U05-Q01).
 * Detalle + listas + prorrateo + Por facturar (InvSum). No reabre Surf U02.
 */
export async function invalidateInvoiceTripSurface(
  queryClient: ReturnType<typeof useQueryClient>,
  tripIds: string[],
  opts?: { amountCorrections?: boolean; includeOpsDay?: boolean },
): Promise<void> {
  const amountCorrections = opts?.amountCorrections === true;
  if (tripIds.length === 0 && !amountCorrections) {
    return;
  }

  await queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });

  for (const tripId of tripIds) {
    await queryClient.invalidateQueries({
      queryKey: tripQueryKeys.detail(tripId),
    });
    // C7: cancel último split_share con viaje cancelled → split auto-closed.
    await queryClient.invalidateQueries({
      queryKey: tripQueryKeys.revenueSplit(tripId),
    });
  }

  await queryClient.invalidateQueries({
    queryKey: [...tripQueryKeys.all, "invoiceable-summary"],
    refetchType: "active",
  });

  if (opts?.includeOpsDay) {
    await queryClient.invalidateQueries({
      queryKey: tripQueryKeys.opsDaySummary(),
      refetchType: "active",
    });
  }

  if (amountCorrections) {
    await queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
  }
}

async function invalidateSubstitutionTripCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  tripIds: string[],
  amountCorrections: boolean,
): Promise<void> {
  await invalidateInvoiceTripSurface(queryClient, tripIds, {
    amountCorrections,
  });
  if (tripIds.length > 0 || amountCorrections) {
    queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
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

/** Semáforo crédito (U04) tras cobro desde factura — resuelve clientId desde listados en caché. */
function invalidateCreditSummariesForInvoiceIds(
  queryClient: ReturnType<typeof useQueryClient>,
  invoiceIds: string[],
): void {
  const wanted = new Set(invoiceIds.filter(Boolean));
  if (wanted.size === 0) return;

  const clientIds = new Set<string>();
  for (const [, data] of queryClient.getQueriesData<{
    data?: Array<{ id?: string; clientId?: string | null }>;
  }>({ queryKey: invoiceQueryKeys.lists() })) {
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

// ============================================================================
// QUERIES
// ============================================================================

export const useInvoices = (
  filters?: InvoiceFilters,
  options?: { enabled?: boolean; keepPreviousData?: boolean },
) => {
  const keepPreviousData = options?.keepPreviousData !== false;
  return useQuery({
    queryKey: invoiceQueryKeys.list(filters),
    queryFn: () => invoicingApi.getAll(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData ? (prev) => prev : undefined,
    enabled: options?.enabled ?? true,
  });
};

export type UseInvoiceOptions = {
  /** When true, skip REP status polling (e.g. while an overlay is open). */
  pausePolling?: boolean;
  /** When false, skip the detail fetch (e.g. parent/freight guard). Default true. */
  enabled?: boolean;
};

export const useInvoice = (id: string, options?: UseInvoiceOptions) => {
  const pausePolling = options?.pausePolling === true;
  return useQuery({
    queryKey: invoiceQueryKeys.detail(id),
    queryFn: () => invoicingApi.getById(id),
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: 30_000,
    refetchInterval: pausePolling
      ? false
      : devRefetchIntervalFn((query: Query<Invoice, Error>) => {
          const invoice = query.state.data;
          // Poll only while REP may still change without user action.
          // Permanent `failed` alone does not warrant polling (F1-Web W5).
          const hasActiveRep = invoice?.payments.some(
            (p: Payment) =>
              p.repStatus === "pending" ||
              p.repStatus === "restamp_pending" ||
              p.repStatus === "cancelling",
          );
          return hasActiveRep ? 5_000 : false;
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
  legId?: string | null,
) => {
  const requiresLeg = scope === "split_share";
  return useQuery({
    queryKey: invoiceQueryKeys.prefill(tripId, scope, legId),
    queryFn: () => invoicingApi.getPrefillFromTrip(tripId, scope, legId),
    enabled: !!tripId && (!requiresLeg || !!legId),
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
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: financeQueryRoot });
      if (data.trips?.length) {
        await invalidateInvoiceLinkedTripCaches(queryClient, data);
      } else if (variables.tripIds?.length) {
        await invalidateSubstitutionTripCaches(
          queryClient,
          variables.tripIds,
          false,
        );
      } else {
        queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
      }
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
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.id),
      });
      queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
      // Update can project into trip.invoicing; prefer trips from response.
      if (data.trips?.length) {
        await invalidateInvoiceLinkedTripCaches(queryClient, data);
      } else {
        // No trips on response: best-effort list refresh (avoids blind ["trips"]).
        queryClient.invalidateQueries({ queryKey: tripQueryKeys.lists() });
      }
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
    onSuccess: async (data, variables, context, mutation) => {
      const cached = queryClient.getQueryData<Invoice>(
        invoiceQueryKeys.detail(variables),
      );
      queryClient.removeQueries({
        queryKey: invoiceQueryKeys.detail(variables),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: financeQueryRoot });
      queryClient.invalidateQueries({ queryKey: invoicePrefillQueriesKey });
      // Delete returns void; use cached trips when present, else broad trips root.
      if (cached?.trips?.length) {
        await invalidateInvoiceLinkedTripCaches(queryClient, cached);
      } else {
        queryClient.invalidateQueries({ queryKey: tripQueryKeys.all });
      }
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
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.dispatchDocuments(),
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
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.dispatchDocuments(),
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
      invalidateCreditSummariesForInvoiceIds(queryClient, [invoiceId]);
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
      // Cobros «Excepciones REP» + follow-through banner (#33 F2)
      queryClient.invalidateQueries({ queryKey: financeQueryRoot });
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
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.dispatchDocuments(),
      });
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

export function useResumeSubstitutionCancel(
  invoiceId: string,
  options?: Omit<
    UseMutationOptions<
      SubstituteStampedInvoiceResult,
      Error,
      { cancellationReason: string }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cancellationReason: string }) =>
      invoicingApi.resumeSubstitutionCancel(invoiceId, payload),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(data.replacement.id),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.dispatchDocuments(),
      });
      await invalidateSubstitutionTripCaches(
        queryClient,
        collectSubstitutionAffectedTripIds(data, {
          cancellationReason: variables.cancellationReason,
        }),
        false,
      );
      await invalidateAndRefetchFinance(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}

export function useInvoiceSendRecipients(
  invoiceId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: invoiceQueryKeys.sendRecipients(invoiceId),
    queryFn: () => invoicingApi.getSendRecipients(invoiceId),
    enabled: enabled && Boolean(invoiceId),
    staleTime: 30_000,
  });
}

/** Destinatarios de envío por payment (REP) — misma shape que invoice. */
export function usePaymentSendRecipients(
  paymentId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: invoiceQueryKeys.paymentSendRecipients(paymentId),
    queryFn: () => invoicingApi.getPaymentSendRecipients(paymentId),
    enabled: enabled && Boolean(paymentId),
    staleTime: 30_000,
  });
}

export function useSendInvoice(
  invoiceId: string,
  options?: Omit<
    UseMutationOptions<SendInvoiceBatchResult, Error, SendInvoicePayload>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pollGenerationRef = useRef(0);

  return useMutation({
    mutationFn: (payload: SendInvoicePayload) =>
      invoicingApi.sendInvoice(invoiceId, payload),
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      await queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.detail(invoiceId),
      });
      queryClient.invalidateQueries({ queryKey: invoiceQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: invoiceQueryKeys.sendRecipients(invoiceId),
      });
      await invalidateAndRefetchFinance(queryClient);

      const queued = data.groups.some((g) => g.status === "queued");
      if (queued && data.batchId) {
        const generation = ++pollGenerationRef.current;
        void (async () => {
          const settled = await pollSendBatchUntilSettled(
            data.batchId,
            queryClient,
            { invoiceId },
          );
          if (generation !== pollGenerationRef.current) return;
          if (!settled) return;
          const sent = settled.groups.filter((g) => g.status === "sent");
          const failed = settled.groups.filter((g) => g.status === "failed");
          if (failed.length === 0 && sent.length > 0) {
            toast({
              variant: "success",
              title: invoicingCopy.send.dialog.toastCompleted,
            });
          } else if (failed.length > 0 && sent.length === 0) {
            toast({
              variant: "error",
              title: invoicingCopy.send.dialog.toastCompletedFail,
              description: failed[0]?.errorMessage ?? undefined,
            });
          }
        })();
      }

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

export function useDownloadRepXml(
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
      invoicingApi.downloadRepXmlById(invoiceId, paymentId, filename),
    ...options,
  });
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

