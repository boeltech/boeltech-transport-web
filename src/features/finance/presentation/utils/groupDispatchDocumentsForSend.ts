import type {
  DispatchDocumentItem,
  DispatchRelatedInvoice,
} from "@features/invoicing/domain";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const labels = dispatchRunsCopy.workbench.documentLabels;

/** Cap de folios de ingreso visibles en Documento REP (TEC-5 / CA #10). */
export const RELATED_INVOICES_UI_CAP = 2;

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

/**
 * Trunca related para UI: hasta `cap` ítems + conteo `+N` del resto.
 * No inventa filas — array vacío → visible vacío.
 */
export function sliceRelatedInvoicesForDisplay(
  related: ReadonlyArray<DispatchRelatedInvoice>,
  cap: number = RELATED_INVOICES_UI_CAP,
): {
  readonly visible: ReadonlyArray<DispatchRelatedInvoice>;
  readonly extraCount: number;
} {
  if (related.length === 0) {
    return { visible: [], extraCount: 0 };
  }
  return {
    visible: related.slice(0, cap),
    extraCount: Math.max(0, related.length - cap),
  };
}

/** Sufijo plano `{f1}, {f2} +N` o `null` si no hay related. */
export function formatRelatedInvoicesPlain(
  related: ReadonlyArray<Pick<DispatchRelatedInvoice, "folioLabel">>,
  cap: number = RELATED_INVOICES_UI_CAP,
): string | null {
  if (related.length === 0) return null;
  const labelsPart = related
    .slice(0, cap)
    .map((item) => item.folioLabel.trim())
    .filter(Boolean);
  if (labelsPart.length === 0) return null;
  const extra = Math.max(0, related.length - cap);
  const joined = labelsPart.join(", ");
  return extra > 0 ? `${joined} +${extra}` : joined;
}

export function formatDispatchDocumentLabel(
  doc: Pick<DispatchDocumentItem, "documentKind" | "folioLabel"> & {
    relatedInvoices?: ReadonlyArray<Pick<DispatchRelatedInvoice, "folioLabel">>;
  },
): string {
  if (doc.documentKind === "rep") {
    const folio = doc.folioLabel.trim();
    const base = folio ? labels.rep(folio) : labels.repFallback;
    const relatedPart = formatRelatedInvoicesPlain(doc.relatedInvoices ?? []);
    return relatedPart ? `${base} · ${relatedPart}` : base;
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
