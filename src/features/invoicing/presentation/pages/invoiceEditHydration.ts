/**
 * One-shot hydration key for `/invoices/:id/edit`.
 * Same invoice must not reset the form when React Query returns a new
 * object identity after refetch **if the user already edited**.
 * If the form is still pristine, a newer server snapshot may apply.
 */

export function invoiceEditHydrationKey(invoiceId: string): string {
  return invoiceId;
}

export function shouldHydrateInvoiceEdit(
  hydratedKey: string | null,
  invoiceId: string,
  options?: { formIsDirty?: boolean },
): boolean {
  if (!invoiceId) return false;
  const key = invoiceEditHydrationKey(invoiceId);
  if (hydratedKey !== key) return true;
  return options?.formIsDirty !== true;
}
