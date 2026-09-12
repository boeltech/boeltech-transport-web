/**
 * Configuración del workbench "Por facturar" (ADR-0090 — handoff Capa 1).
 *
 * Buckets (lockstep API classifyInvoiceableBucket):
 *   ready             → CTA Facturar (primaria / false_trip)
 *   proration_pending → split activo + canGenerateSplitShareInvoice
 *   blocked           → resto (blockReason, datos incompletos, split sin CTA)
 */

export type InvoiceableBucketId =
  | "ready"
  | "proration_pending"
  | "blocked";

export const INVOICEABLE_WORKBENCH_BUCKETS: InvoiceableBucketId[] = [
  "ready",
  "proration_pending",
  "blocked",
];

export const DEFAULT_INVOICEABLE_BUCKET: InvoiceableBucketId = "ready";

export function isInvoiceableBucket(
  value: string,
): value is InvoiceableBucketId {
  return INVOICEABLE_WORKBENCH_BUCKETS.includes(value as InvoiceableBucketId);
}
