import type { WorkbenchBucket, WorkbenchBucketTone } from "@shared/ui/page-shells";
import type { TripListItem } from "@features/trips/domain";
import { shouldOpenInvoiceCreateFromFinanceHub } from "@features/invoicing";
import {
  INVOICEABLE_WORKBENCH_BUCKETS,
  type InvoiceableBucketId,
} from "../config/invoiceableWorkbenchConfig";
import { financeCopy } from "../copy";

const copy = financeCopy.invoiceable.workbench;

// ============================================================================
// CLASSIFICATION
// ============================================================================

/** Classifies a trip into its workbench bucket using existing business helpers. */
export function classifyInvoiceableBucket(
  trip: TripListItem,
): InvoiceableBucketId {
  if (shouldOpenInvoiceCreateFromFinanceHub(trip)) return "ready";
  if (trip.invoicing.hasActiveSplit) return "proration_pending";
  return "blocked";
}

/** Splits a list of trips into per-bucket groups. */
export function partitionTripsByBucket(
  trips: TripListItem[],
): Record<InvoiceableBucketId, TripListItem[]> {
  const result: Record<InvoiceableBucketId, TripListItem[]> = {
    ready: [],
    proration_pending: [],
    blocked: [],
  };

  for (const trip of trips) {
    result[classifyInvoiceableBucket(trip)].push(trip);
  }

  return result;
}

// ============================================================================
// COUNTS (from current page — degraded mode until backend exposes totals)
// ============================================================================

export interface InvoiceableBucketCounts {
  ready: number;
  proration_pending: number;
  blocked: number;
}

export function countTripsByBucket(
  trips: TripListItem[],
): InvoiceableBucketCounts {
  const counts: InvoiceableBucketCounts = {
    ready: 0,
    proration_pending: 0,
    blocked: 0,
  };

  for (const trip of trips) {
    counts[classifyInvoiceableBucket(trip)]++;
  }

  return counts;
}

// ============================================================================
// BUCKET → WorkbenchBucket[] MAPPER
// ============================================================================

function toneForBucket(
  bucket: InvoiceableBucketId,
  count: number,
): WorkbenchBucketTone {
  if (count <= 0) return "default";
  if (bucket === "ready") return "success";
  if (bucket === "blocked") return "warning";
  return "default";
}

export interface MapInvoiceableWorkbenchBucketsParams {
  counts: InvoiceableBucketCounts;
  activeBucket: InvoiceableBucketId;
  onBucketChange: (bucket: InvoiceableBucketId) => void;
}

export function mapInvoiceableWorkbenchBuckets({
  counts,
  activeBucket,
  onBucketChange,
}: MapInvoiceableWorkbenchBucketsParams): WorkbenchBucket[] {
  return INVOICEABLE_WORKBENCH_BUCKETS.map((bucket) => ({
    id: bucket,
    label: copy.buckets[bucket],
    description: copy.bucketDescriptions[bucket],
    count: counts[bucket],
    isActive: activeBucket === bucket,
    onClick: () => onBucketChange(bucket),
    tone: toneForBucket(bucket, counts[bucket]),
  }));
}
