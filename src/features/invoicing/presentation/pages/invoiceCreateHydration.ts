import type { InvoiceBillingScope } from "@features/invoicing/domain";

/**
 * One-shot hydration key for `/invoices/new` prefill.
 * Same trip+scope(+leg) must not reset the form when React Query returns a new
 * object identity after refetch **if the user already edited** (window focus).
 * If the form is still pristine, a newer prefill (client CP/RFC) should apply.
 */
export function invoiceCreateHydrationKey(
  tripId: string,
  scope: InvoiceBillingScope,
  legId?: string | null,
): string {
  const leg = legId?.trim() ? legId.trim() : "";
  return leg ? `${tripId}:${scope}:${leg}` : `${tripId}:${scope}`;
}

export function shouldHydrateInvoiceCreate(
  hydratedKey: string | null,
  tripId: string,
  scope: InvoiceBillingScope,
  options?: { formIsDirty?: boolean; legId?: string | null },
): boolean {
  if (!tripId) return false;
  const key = invoiceCreateHydrationKey(tripId, scope, options?.legId);
  if (hydratedKey !== key) return true;
  return options?.formIsDirty !== true;
}
