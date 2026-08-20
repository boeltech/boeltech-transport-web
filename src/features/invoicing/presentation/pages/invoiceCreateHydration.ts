import type { InvoiceBillingScope } from "@features/invoicing/domain";

/**
 * One-shot hydration key for `/invoices/new` prefill.
 * Same trip+scope must not reset the form when React Query returns a new
 * object identity after refetch **if the user already edited** (window focus).
 * If the form is still pristine, a newer prefill (client CP/RFC) should apply.
 */
export function invoiceCreateHydrationKey(
  tripId: string,
  scope: InvoiceBillingScope,
): string {
  return `${tripId}:${scope}`;
}

export function shouldHydrateInvoiceCreate(
  hydratedKey: string | null,
  tripId: string,
  scope: InvoiceBillingScope,
  options?: { formIsDirty?: boolean },
): boolean {
  if (!tripId) return false;
  const key = invoiceCreateHydrationKey(tripId, scope);
  if (hydratedKey !== key) return true;
  return options?.formIsDirty !== true;
}
