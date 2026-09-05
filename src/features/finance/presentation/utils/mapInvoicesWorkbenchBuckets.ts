import type { WorkbenchBucket, WorkbenchBucketTone } from "@shared/ui/page-shells";
import type { FinanceSummary, FinanceInvoiceStatus } from "@features/finance/domain";
import {
  INVOICES_WORKBENCH_STATUS_BUCKETS,
  type InvoicesWorkbenchBucketId,
} from "../config/invoicesWorkbenchConfig";
import { financeCopy } from "../copy";

const workbenchCopy = financeCopy.invoices.workbench;
const statusLabels = financeCopy.invoices.statusLabels;

export interface InvoicesBucketCounts {
  all: number;
  draft: number;
  stamping: number;
  stamped: number;
  cancellation_pending: number;
  cancelled: number;
}

export function countsFromFinanceSummary(
  summary: FinanceSummary | undefined,
  options?: {
    stampingCount?: number;
  },
): InvoicesBucketCounts {
  const draft = summary?.invoicesByStatus.draft ?? 0;
  const stamping = options?.stampingCount ?? 0;
  const stamped = summary?.invoicesByStatus.stamped ?? 0;
  const cancellation_pending = summary?.invoicesByStatus.cancellationPending ?? 0;
  const cancelled = summary?.invoicesByStatus.cancelled ?? 0;
  const all = draft + stamping + stamped + cancellation_pending + cancelled;

  return {
    all,
    draft,
    stamping,
    stamped,
    cancellation_pending,
    cancelled,
  };
}

function toneForBucket(
  bucket: InvoicesWorkbenchBucketId,
  count: number,
): WorkbenchBucketTone {
  if (count <= 0) return "default";
  if (bucket === "stamped") return "success";
  if (bucket === "cancellation_pending" || bucket === "stamping") return "warning";
  if (bucket === "cancelled") return "destructive";
  return "default";
}

function labelForBucket(bucket: FinanceInvoiceStatus): string {
  return statusLabels[bucket];
}

export interface MapInvoicesWorkbenchBucketsParams {
  counts: InvoicesBucketCounts;
  activeBucket: InvoicesWorkbenchBucketId;
  onBucketChange: (bucket: InvoicesWorkbenchBucketId) => void;
}

export function mapInvoicesWorkbenchBuckets({
  counts,
  activeBucket,
  onBucketChange,
}: MapInvoicesWorkbenchBucketsParams): WorkbenchBucket[] {
  return INVOICES_WORKBENCH_STATUS_BUCKETS.map((bucket) => ({
    id: bucket,
    label: labelForBucket(bucket),
    description: workbenchCopy.bucketDescriptions[bucket],
    count: counts[bucket],
    isActive: activeBucket === bucket,
    onClick: () =>
      onBucketChange(activeBucket === bucket ? "all" : bucket),
    tone: toneForBucket(bucket, counts[bucket]),
  }));
}
