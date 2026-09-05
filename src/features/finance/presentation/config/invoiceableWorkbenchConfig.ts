/**
 * Configuración del workbench "Por facturar" (ADR-0090 — handoff Capa 1).
 *
 * Buckets derivados de la lógica existente en `shouldOpenInvoiceCreateFromFinanceHub`:
 *   ready            → CTA Facturar directo
 *   proration_pending → split activo (ir al hub del viaje)
 *   blocked          → el resto (blockReason, datos incompletos)
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
