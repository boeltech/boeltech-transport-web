/**
 * Configuración del workbench de Cobros (ADR-0090 — handoff Capa 1 D7).
 *
 * Buckets:
 *   all             → Todas las facturas PPD abiertas
 *   overdue         → Vencidas (due_date < today)
 *   partial         → Pago parcial (totalPaid > 0 && balanceDue > 0)
 *   rep_exceptions  → Excepciones REP (comprobantes por atender)
 */

export type CobrosBucketId =
  | "all"
  | "overdue"
  | "partial"
  | "rep_exceptions";

export const COBROS_WORKBENCH_BUCKETS: CobrosBucketId[] = [
  "all",
  "overdue",
  "partial",
  "rep_exceptions",
];

export const DEFAULT_COBROS_BUCKET: CobrosBucketId = "all";

export function isCobrosBucket(value: string): value is CobrosBucketId {
  return COBROS_WORKBENCH_BUCKETS.includes(value as CobrosBucketId);
}
