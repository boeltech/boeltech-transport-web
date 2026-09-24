import type { InvoiceListItem } from "@features/invoicing/domain";

/**
 * Agrupa facturas del workbench de envío por cliente de envío.
 * Defensa D2: si el mismo `clientId` trae más de un RFC receptor
 * (list viejo / race), parte el grupo para no mezclar receptores fiscales.
 * Fallback: `rfc:{receiverRfc}` cuando `clientId` es null.
 */
export type DispatchInvoiceGroup = {
  /** clientId, `clientId:RFC` si se partió, o `rfc:{receiverRfc}` */
  readonly groupKey: string;
  readonly clientId: string | null;
  /** Label de receptor CFDI (`receiverName` / RFC), no trade name del viaje. */
  readonly clientName: string;
  readonly receiverRfc: string;
  readonly invoices: InvoiceListItem[];
  /** Cualquier factura del grupo — GET send-recipients 1× por grupo. */
  readonly sampleInvoiceId: string;
};

function normalizeRfc(rfc: string): string {
  return rfc.trim().toUpperCase();
}

function resolveBaseKey(invoice: InvoiceListItem): string {
  if (invoice.clientId) return invoice.clientId;
  return `rfc:${normalizeRfc(invoice.receiverRfc)}`;
}

function resolveReceiverLabel(invoice: InvoiceListItem): string {
  const name = invoice.receiverName?.trim();
  return name || invoice.receiverRfc;
}

export function invoiceFolioLabel(invoice: InvoiceListItem): string {
  return `${invoice.serie}-${invoice.folio}`;
}

export function groupInvoicesForDispatch(
  invoices: InvoiceListItem[],
): DispatchInvoiceGroup[] {
  const byBase = new Map<string, InvoiceListItem[]>();

  for (const invoice of invoices) {
    const key = resolveBaseKey(invoice);
    const bucket = byBase.get(key);
    if (bucket) {
      bucket.push(invoice);
    } else {
      byBase.set(key, [invoice]);
    }
  }

  const groups: DispatchInvoiceGroup[] = [];

  for (const [baseKey, bucket] of byBase.entries()) {
    const byRfc = new Map<string, InvoiceListItem[]>();
    for (const invoice of bucket) {
      const rfc = normalizeRfc(invoice.receiverRfc);
      const rfcBucket = byRfc.get(rfc);
      if (rfcBucket) {
        rfcBucket.push(invoice);
      } else {
        byRfc.set(rfc, [invoice]);
      }
    }

    const shouldSplitByRfc = Boolean(bucket[0]?.clientId) && byRfc.size > 1;

    for (const [rfc, rfcInvoices] of byRfc.entries()) {
      const first = rfcInvoices[0]!;
      groups.push({
        groupKey: shouldSplitByRfc ? `${baseKey}:${rfc}` : baseKey,
        clientId: first.clientId,
        clientName: resolveReceiverLabel(first),
        receiverRfc: first.receiverRfc,
        invoices: rfcInvoices,
        sampleInvoiceId: first.id,
      });
    }
  }

  return groups;
}
