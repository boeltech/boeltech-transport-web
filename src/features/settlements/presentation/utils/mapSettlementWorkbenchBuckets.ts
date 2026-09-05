import type { WorkbenchBucket } from "@shared/ui/page-shells";
import type { SettlementWorkbenchSummary } from "../../domain/entities";
import {
  SETTLEMENT_WORKBENCH_BUCKETS,
  settlementsCompensationApprovalsPath,
  type SettlementWorkbenchNavBucket,
} from "../config/settlementWorkbenchConfig";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench;

function countForBucket(
  bucket: SettlementWorkbenchNavBucket,
  summary: SettlementWorkbenchSummary,
): number {
  switch (bucket) {
    case "pending":
      return summary.pending;
    case "draft":
      return summary.draft;
    case "payable":
      return summary.payable;
    case "closed":
      return summary.closed;
  }
}

function toneForBucket(
  bucket: SettlementWorkbenchNavBucket,
  count: number,
): WorkbenchBucket["tone"] {
  if (count <= 0) return "default";
  if (bucket === "pending" || bucket === "payable") return "warning";
  if (bucket === "closed") return "success";
  return "default";
}

export interface MapSettlementWorkbenchBucketsParams {
  summary: SettlementWorkbenchSummary;
  activeBucket: SettlementWorkbenchNavBucket;
  onBucketChange: (bucket: SettlementWorkbenchNavBucket) => void;
}

/**
 * Maps workbench summary → WorkbenchPageShell buckets (ADR-0090).
 * Solo etapas de liquidación (+ crossLink de autorización).
 * Anticipos se enlazan debajo del scorecard (openAdvancesBridge), no como bucket.
 */
export function mapSettlementWorkbenchBuckets({
  summary,
  activeBucket,
  onBucketChange,
}: MapSettlementWorkbenchBucketsParams): WorkbenchBucket[] {
  const buckets: WorkbenchBucket[] = SETTLEMENT_WORKBENCH_BUCKETS.map(
    (bucket) => {
      const count = countForBucket(bucket, summary);
      return {
        id: bucket,
        label: copy.buckets[bucket],
        description: copy.bucketDescriptions[bucket],
        count,
        isActive: activeBucket === bucket,
        onClick: () => onBucketChange(bucket),
        tone: toneForBucket(bucket, count),
      };
    },
  );

  if (summary.approval > 0) {
    buckets.push({
      id: "approval",
      label: copy.buckets.approval,
      description: copy.bucketDescriptions.approval,
      count: summary.approval,
      isActive: false,
      onClick: () => undefined,
      tone: "warning",
      crossLink: {
        href: settlementsCompensationApprovalsPath(),
        label: copy.approvalLink(summary.approval),
      },
    });
  }

  return buckets;
}
