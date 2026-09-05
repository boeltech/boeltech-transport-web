/**
 * mapTripWorkbenchBuckets — ADR-0090 workbench de viajes.
 *
 * Convierte TripWorkbenchSummary + estado activo → WorkbenchBucket[]
 * consumibles por WorkbenchPageShell.
 */

import type { WorkbenchBucket } from "@shared/ui/page-shells";
import type { TripWorkbenchSummary } from "../../domain";
import type { TripWorkbenchBucket } from "../config/tripWorkbenchConfig";
import { tripsListCopy } from "../copy/listCopy";

const copy = tripsListCopy.workbench;

function countForBucket(
  bucket: TripWorkbenchBucket,
  summary: TripWorkbenchSummary,
): number {
  switch (bucket) {
    case "draft":
      return summary.draft;
    case "scheduled":
      return summary.scheduled;
    case "in_progress":
      return summary.inProgress;
    case "completed":
      return summary.completed;
    case "cancelled":
      return summary.cancelled;
  }
}

function toneForBucket(
  bucket: TripWorkbenchBucket,
  count: number,
): WorkbenchBucket["tone"] {
  if (count <= 0) return "default";
  switch (bucket) {
    case "draft":
      return "default";
    case "scheduled":
      return "warning";
    case "in_progress":
      return "warning";
    case "completed":
      return "success";
    case "cancelled":
      return "destructive";
  }
}

export interface MapTripWorkbenchBucketsParams {
  summary: TripWorkbenchSummary;
  visibleBuckets: TripWorkbenchBucket[];
  activeBucket: TripWorkbenchBucket | null;
  onBucketChange: (bucket: TripWorkbenchBucket) => void;
}

export function mapTripWorkbenchBuckets({
  summary,
  visibleBuckets,
  activeBucket,
  onBucketChange,
}: MapTripWorkbenchBucketsParams): WorkbenchBucket[] {
  const buckets: WorkbenchBucket[] = visibleBuckets.map((bucket) => {
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
  });

  // Cross-link de atención fiscal (solo si hay viajes con atención)
  if (summary.fiscalAttention > 0) {
    buckets.push({
      id: "fiscal_attention",
      label: copy.buckets.fiscalAttention,
      description: copy.bucketDescriptions.fiscalAttention,
      count: summary.fiscalAttention,
      isActive: false,
      onClick: () => undefined,
      tone: "destructive",
      crossLink: {
        href: "/finance/invoiceable",
        label: copy.fiscalAttentionLink(summary.fiscalAttention),
      },
    });
  }

  return buckets;
}
