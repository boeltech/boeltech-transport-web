import type { FinanceSummary } from "@features/finance/domain";

/** Counts from FinanceSummary.invoicesByStatus (current inventory, not month-scoped). */
export interface InvoicesStatusBreakdown {
  stamped: number;
  /** Drafts awaiting stamp — honest “pendientes”. */
  pending: number;
  cancellationPending: number;
  cancelled: number;
  total: number;
}

export function buildInvoicesStatusBreakdown(
  summary: FinanceSummary | undefined,
): InvoicesStatusBreakdown | null {
  if (!summary?.invoicesByStatus) return null;

  const { draft, stamped, cancellationPending, cancelled } =
    summary.invoicesByStatus;
  const pending = draft;
  const total = stamped + pending + cancellationPending + cancelled;

  return {
    stamped,
    pending,
    cancellationPending,
    cancelled,
    total,
  };
}

export function isInvoicesBreakdownEmpty(
  breakdown: InvoicesStatusBreakdown | null,
): boolean {
  return !breakdown || breakdown.total <= 0;
}
