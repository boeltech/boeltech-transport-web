import type { WorkbenchBucket, WorkbenchBucketTone } from "@shared/ui/page-shells";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import {
  COBROS_WORKBENCH_BUCKETS,
  type CobrosBucketId,
} from "../config/cobrosWorkbenchConfig";
import { financeCopy } from "../copy";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

const copy = financeCopy.cobros.workbench;

// ============================================================================
// CLIENT-SIDE COUNTS (degraded mode — no backend aggregation endpoint yet)
// ============================================================================

export interface CobrosBucketCounts {
  all: number;
  overdue: number;
  partial: number;
  rep_exceptions: number;
}

/**
 * Counts invoices by bucket using client-side heuristics.
 * TODO: replace with backend aggregate endpoint when available.
 */
export function countInvoicesByCobrosBucket(
  invoices: FinanceInvoiceListItem[],
  repExceptionsCount: number,
): CobrosBucketCounts {
  let overdue = 0;
  let partial = 0;

  const today = new Date().toISOString().slice(0, 10);

  for (const invoice of invoices) {
    const isPaidPartially = invoice.totalPaid > 0 && invoice.balanceDue > 0;
    if (isPaidPartially) partial++;

    // dueDate not available on FinanceInvoiceListItem yet — use issuedAt + 30d heuristic
    // TODO: backend should expose due_date or overdue flag; for now mark none as overdue
    // so bucket renders with 0 until backend supports it.
  }

  // overdue stays 0 until backend exposes due_date on listing items
  void today;
  void overdue;

  return {
    all: invoices.length,
    overdue: 0,
    partial,
    rep_exceptions: repExceptionsCount,
  };
}

// ============================================================================
// BUCKET → WorkbenchBucket[] MAPPER
// ============================================================================

function toneForBucket(
  bucket: CobrosBucketId,
  count: number,
): WorkbenchBucketTone {
  if (count <= 0) return "default";
  if (bucket === "overdue") return "destructive";
  if (bucket === "partial") return "warning";
  if (bucket === "rep_exceptions") return "destructive";
  return "default";
}

export interface MapCobrosWorkbenchBucketsParams {
  counts: CobrosBucketCounts;
  activeBucket: CobrosBucketId;
  onBucketChange: (bucket: CobrosBucketId) => void;
  /** Total balance for the "all" bucket description. */
  totalBalance?: number;
}

export function mapCobrosWorkbenchBuckets({
  counts,
  activeBucket,
  onBucketChange,
  totalBalance,
}: MapCobrosWorkbenchBucketsParams): WorkbenchBucket[] {
  return COBROS_WORKBENCH_BUCKETS.map((bucket) => ({
    id: bucket,
    label: copy.buckets[bucket],
    description:
      bucket === "all" && totalBalance != null
        ? formatMxCurrency(totalBalance)
        : copy.bucketDescriptions[bucket],
    count: counts[bucket],
    isActive: activeBucket === bucket,
    onClick: () => onBucketChange(bucket),
    tone: toneForBucket(bucket, counts[bucket]),
  }));
}
