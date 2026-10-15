import type {
  InvoiceBillingScope,
  InvoiceFilters,
} from "@features/invoicing/domain";

/**
 * Query keys de facturación — contrato de invalidación (barrido T1).
 * Mutaciones deben invalidar vía estas keys o `invalidateInvoiceQueries`.
 */
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
    legId?: string | null,
  ) => [...invoiceQueryKeys.prefills(), tripId, scope, legId ?? null] as const,
  sendRecipients: (id: string) =>
    [...invoiceQueryKeys.detail(id), "send-recipients"] as const,
};
