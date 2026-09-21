/**
 * Configuración del workbench de Cobros (ADR-0090 — variante A).
 *
 * Buckets:
 *   open            → PPD abiertas con saldo (default accionable)
 *   partial         → Con pagos registrados y saldo remanente
 *   rep_exceptions  → Excepciones REP (superficie distinta del strip)
 *
 * Sin bucket `overdue` (no hay due_date real en open-ppd).
 */

export type CobrosBucketId = "open" | "partial" | "rep_exceptions";

/** Buckets que consultan `GET /finance/open-ppd-invoices` con `cobros_bucket`. */
export type CobrosListBucketId = "open" | "partial";

export const COBROS_WORKBENCH_BUCKETS: CobrosBucketId[] = [
  "open",
  "partial",
  "rep_exceptions",
];

export const DEFAULT_COBROS_BUCKET: CobrosBucketId = "open";

export function isCobrosBucket(value: string): value is CobrosBucketId {
  return COBROS_WORKBENCH_BUCKETS.includes(value as CobrosBucketId);
}

export function isCobrosListBucket(value: string): value is CobrosListBucketId {
  return value === "open" || value === "partial";
}
