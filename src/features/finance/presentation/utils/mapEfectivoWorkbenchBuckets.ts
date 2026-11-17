import type { WorkbenchBucket, WorkbenchBucketTone } from "@shared/ui/page-shells";
import type { OperationalCashCobrosBucket } from "@features/finance/domain";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

export const EFECTIVO_WORKBENCH_BUCKETS: OperationalCashCobrosBucket[] = [
  "open",
  "partial",
];

export const DEFAULT_EFECTIVO_BUCKET: OperationalCashCobrosBucket = "open";

export function isEfectivoCobrosBucket(
  value: string,
): value is OperationalCashCobrosBucket {
  return value === "open" || value === "partial";
}

const BUCKET_LABELS: Record<OperationalCashCobrosBucket, string> = {
  open: "Por cobrar",
  partial: "Con abono parcial",
};

function toneForBucket(
  bucket: OperationalCashCobrosBucket,
  count: number,
): WorkbenchBucketTone {
  if (count <= 0) return "default";
  if (bucket === "partial") return "warning";
  return "success";
}

export interface EfectivoBucketTotals {
  tripCount: number;
  pendingAmount: number;
}

export interface MapEfectivoWorkbenchBucketsParams {
  open: EfectivoBucketTotals;
  partial: EfectivoBucketTotals;
  activeBucket: OperationalCashCobrosBucket;
  onBucketChange: (bucket: OperationalCashCobrosBucket) => void;
}

/** Buckets C2: conteo + monto; click filtra `cobros_bucket` (paridad Facturas a crédito). */
export function mapEfectivoWorkbenchBuckets({
  open,
  partial,
  activeBucket,
  onBucketChange,
}: MapEfectivoWorkbenchBucketsParams): WorkbenchBucket[] {
  const byId: Record<OperationalCashCobrosBucket, EfectivoBucketTotals> = {
    open,
    partial,
  };
  return EFECTIVO_WORKBENCH_BUCKETS.map((bucket) => {
    const totals = byId[bucket];
    return {
      id: bucket,
      label: BUCKET_LABELS[bucket],
      count: totals.tripCount,
      description: formatMxCurrency(totals.pendingAmount),
      isActive: activeBucket === bucket,
      onClick: () => onBucketChange(bucket),
      tone: toneForBucket(bucket, totals.tripCount),
    };
  });
}
