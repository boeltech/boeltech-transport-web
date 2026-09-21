import type { FinanceInvoiceListItem } from "@features/finance/domain";

/**
 * RFC ancla de la selección multi-factura (mismo receptor REP).
 * Primera factura marcada define el alcance; el resto debe coincidir.
 */
export function resolveCobrosSelectionAnchorRfc(
  invoices: FinanceInvoiceListItem[],
  selected: Record<string, boolean>,
): string | null {
  for (const invoice of invoices) {
    if (selected[invoice.id]) {
      const rfc = invoice.receiverRfc.trim().toUpperCase();
      return rfc || null;
    }
  }
  return null;
}

export function isCobrosInvoiceSelectable(
  invoice: FinanceInvoiceListItem,
  anchorRfc: string | null,
): boolean {
  if (!anchorRfc) return true;
  return invoice.receiverRfc.trim().toUpperCase() === anchorRfc;
}

/** Filas que el "seleccionar página" puede marcar sin romper el ancla RFC. */
export function cobrosInvoicesForPageToggle(
  invoices: FinanceInvoiceListItem[],
  anchorRfc: string | null,
): FinanceInvoiceListItem[] {
  if (!anchorRfc) {
    const first = invoices[0];
    if (!first) return [];
    const firstRfc = first.receiverRfc.trim().toUpperCase();
    return invoices.filter(
      (invoice) => invoice.receiverRfc.trim().toUpperCase() === firstRfc,
    );
  }
  return invoices.filter((invoice) =>
    isCobrosInvoiceSelectable(invoice, anchorRfc),
  );
}
