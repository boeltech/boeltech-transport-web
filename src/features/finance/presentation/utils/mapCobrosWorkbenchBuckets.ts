import type { WorkbenchBucket, WorkbenchBucketTone } from "@shared/ui/page-shells";
import type { FinanceOpenPpdSummary } from "@features/finance/domain";
import {
  COBROS_WORKBENCH_BUCKETS,
  type CobrosBucketId,
} from "../config/cobrosWorkbenchConfig";
import { financeCopy } from "../copy";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

const copy = financeCopy.cobros.workbench;

// ============================================================================
// COUNTS (desde summary API — no conteos de la página)
// ============================================================================

export interface CobrosBucketCounts {
  open: number;
  partial: number;
  rep_exceptions: number;
}

export function countsFromOpenPpdSummary(
  summary: FinanceOpenPpdSummary,
): CobrosBucketCounts {
  return {
    open: summary.open,
    partial: summary.partial,
    rep_exceptions: summary.repExceptions,
  };
}

export const EMPTY_COBROS_BUCKET_COUNTS: CobrosBucketCounts = {
  open: 0,
  partial: 0,
  rep_exceptions: 0,
};

// ============================================================================
// BUCKET → WorkbenchBucket[] MAPPER
// ============================================================================

function toneForBucket(
  bucket: CobrosBucketId,
  count: number,
): WorkbenchBucketTone {
  if (count <= 0) return "default";
  if (bucket === "partial") return "warning";
  if (bucket === "rep_exceptions") return "destructive";
  return "success";
}

export interface MapCobrosWorkbenchBucketsParams {
  counts: CobrosBucketCounts;
  activeBucket: CobrosBucketId;
  onBucketChange: (bucket: CobrosBucketId) => void;
  /** Saldo total del universo `open` filtrado (summary.totalBalance). */
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
      bucket === "open" && totalBalance != null
        ? formatMxCurrency(totalBalance)
        : copy.bucketDescriptions[bucket],
    count: counts[bucket],
    isActive: activeBucket === bucket,
    onClick: () => onBucketChange(bucket),
    tone: toneForBucket(bucket, counts[bucket]),
  }));
}
