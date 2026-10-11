/** PRD: Sheet when the lote is large enough that a menu overflows. */
export const COBROS_INVOICE_NAV_SHEET_THRESHOLD = 12;

/** PRD: visible folio chips before «+N más». */
export const COBROS_INVOICE_FOLIO_VISIBLE_LIMIT = 3;

export interface CobrosInvoiceNavTarget {
  readonly id: string;
  readonly serie: string;
  readonly folio: number;
}

export function invoicePaymentsHref(invoiceId: string): string {
  return `/invoices/${invoiceId}#invoice-payments`;
}

export function folioLabel(invoice: CobrosInvoiceNavTarget): string {
  return `${invoice.serie}-${invoice.folio}`;
}

/** Build targets from allocation-like rows (`ingressInvoiceId`) or tray invoices (`id`). */
export function toInvoiceNavTargets(
  rows: readonly {
    id?: string;
    ingressInvoiceId?: string;
    serie: string;
    folio: number;
  }[],
): CobrosInvoiceNavTarget[] {
  return rows
    .map((row) => ({
      id: row.id ?? row.ingressInvoiceId ?? "",
      serie: row.serie,
      folio: row.folio,
    }))
    .filter((row) => row.id.length > 0);
}
