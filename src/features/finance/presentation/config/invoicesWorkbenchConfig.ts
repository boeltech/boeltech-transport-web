/**
 * Configuración del workbench de Facturas (ADR-0090 — handoff Capa 1).
 */

import type { FinanceInvoiceStatus } from "@features/finance/domain";

export type InvoicesWorkbenchBucketId = "all" | FinanceInvoiceStatus;

/** Celdas del awareness strip (máx. 5 en una fila en lg). «Todas» no es celda. */
export const INVOICES_WORKBENCH_STATUS_BUCKETS: FinanceInvoiceStatus[] = [
  "draft",
  "stamping",
  "stamped",
  "cancellation_pending",
  "cancelled",
];

export const DEFAULT_INVOICES_BUCKET: InvoicesWorkbenchBucketId = "all";

export function isInvoicesWorkbenchBucket(
  value: string,
): value is InvoicesWorkbenchBucketId {
  return (
    value === "all" ||
    INVOICES_WORKBENCH_STATUS_BUCKETS.includes(value as FinanceInvoiceStatus)
  );
}

export function bucketToInvoiceStatus(
  bucket: InvoicesWorkbenchBucketId,
): FinanceInvoiceStatus | undefined {
  if (bucket === "all") return undefined;
  return bucket;
}
