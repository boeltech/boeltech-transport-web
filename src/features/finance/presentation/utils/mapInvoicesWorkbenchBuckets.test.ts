import { describe, expect, it, vi } from "vitest";
import {
  countsFromFinanceSummary,
  mapInvoicesWorkbenchBuckets,
} from "./mapInvoicesWorkbenchBuckets";

describe("countsFromFinanceSummary", () => {
  it("maps summary fields and sums all from status counts", () => {
    const counts = countsFromFinanceSummary(
      {
        totalReceivable: 0,
        collectedThisMonth: 0,
        totalOverdue: 0,
        expensesThisMonth: 0,
        invoicesByStatus: {
          draft: 2,
          stamped: 10,
          cancellationPending: 1,
          cancelled: 3,
        },
      },
      { stampingCount: 4 },
    );

    expect(counts).toEqual({
      all: 20,
      draft: 2,
      stamping: 4,
      stamped: 10,
      cancellation_pending: 1,
      cancelled: 3,
    });
  });
});

describe("mapInvoicesWorkbenchBuckets", () => {
  it("maps five status buckets and toggles active back to all", () => {
    const onBucketChange = vi.fn();
    const counts = {
      all: 20,
      draft: 2,
      stamping: 1,
      stamped: 10,
      cancellation_pending: 1,
      cancelled: 3,
    };

    const buckets = mapInvoicesWorkbenchBuckets({
      counts,
      activeBucket: "draft",
      onBucketChange,
    });

    expect(buckets).toHaveLength(5);
    expect(buckets[0]?.id).toBe("draft");
    expect(buckets[0]?.isActive).toBe(true);
    expect(buckets[2]?.id).toBe("stamped");
    expect(buckets[2]?.tone).toBe("success");

    buckets[0]?.onClick();
    expect(onBucketChange).toHaveBeenCalledWith("all");

    buckets[2]?.onClick();
    expect(onBucketChange).toHaveBeenCalledWith("stamped");
  });

  it("marks no status active when viewing the full registry", () => {
    const buckets = mapInvoicesWorkbenchBuckets({
      counts: {
        all: 0,
        draft: 0,
        stamping: 0,
        stamped: 0,
        cancellation_pending: 0,
        cancelled: 0,
      },
      activeBucket: "all",
      onBucketChange: vi.fn(),
    });

    expect(buckets.every((bucket) => bucket.isActive === false)).toBe(true);
  });
});
