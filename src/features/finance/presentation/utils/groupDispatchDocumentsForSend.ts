import type { DispatchDocumentItem } from "@features/invoicing/domain";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const labels = dispatchRunsCopy.workbench.documentLabels;

/**
 * Agrupa documentos tipados del workbench por `groupKey` del API (paridad send-batch).
 */
export type DispatchDocumentGroup = {
  readonly groupKey: string;
  readonly clientId: string | null;
  readonly clientName: string;
  readonly receiverRfc: string;
  readonly documents: DispatchDocumentItem[];
  /** Primera factura del grupo — GET /invoices/:id/send-recipients. */
  readonly sampleInvoiceId: string | null;
  /** Primer REP del grupo — GET /payments/:id/send-recipients si no hay factura. */
  readonly samplePaymentId: string | null;
};

export function dispatchDocumentSelectionKey(
  doc: Pick<DispatchDocumentItem, "documentKind" | "id">,
): string {
  return `${doc.documentKind}:${doc.id}`;
}

export function formatDispatchDocumentLabel(
  doc: Pick<DispatchDocumentItem, "documentKind" | "folioLabel">,
): string {
  if (doc.documentKind === "rep") {
    const folio = doc.folioLabel.trim();
    return folio ? labels.rep(folio) : labels.repFallback;
  }
  const folio = doc.folioLabel.trim();
  return folio ? labels.invoice(folio) : labels.invoiceFallback;
}

export function groupDispatchDocumentsForSend(
  documents: DispatchDocumentItem[],
): DispatchDocumentGroup[] {
  const byKey = new Map<string, DispatchDocumentItem[]>();

  for (const doc of documents) {
    const bucket = byKey.get(doc.groupKey);
    if (bucket) {
      bucket.push(doc);
    } else {
      byKey.set(doc.groupKey, [doc]);
    }
  }

  const groups: DispatchDocumentGroup[] = [];

  for (const [groupKey, bucket] of byKey.entries()) {
    const first = bucket[0]!;
    const invoices = bucket.filter((d) => d.documentKind === "invoice");
    const reps = bucket.filter((d) => d.documentKind === "rep");
    const name = first.clientName?.trim() || first.receiverRfc;

    groups.push({
      groupKey,
      clientId: first.clientId,
      clientName: name,
      receiverRfc: first.receiverRfc,
      documents: bucket,
      sampleInvoiceId: invoices[0]?.id ?? null,
      samplePaymentId: reps[0]?.id ?? null,
    });
  }

  return groups;
}
