import { describe, expect, it, vi } from "vitest";
import { mapApprovalWorkbenchBuckets } from "./mapApprovalWorkbenchBuckets";

describe("mapApprovalWorkbenchBuckets", () => {
  it("maps three inbox types with counts and active type", () => {
    const onTypeChange = vi.fn();
    const buckets = mapApprovalWorkbenchBuckets({
      activeType: "driver_advance_request",
      counts: {
        trip_expense: 4,
        driver_advance_request: 2,
        internal_staff_compensation: 1,
      },
      onTypeChange,
    });

    expect(buckets).toHaveLength(3);
    expect(buckets[0]?.id).toBe("trip_expense");
    expect(buckets[0]?.count).toBe(4);
    expect(buckets[1]?.isActive).toBe(true);
    expect(buckets[2]?.count).toBe(1);

    buckets[0]?.onClick();
    expect(onTypeChange).toHaveBeenCalledWith("trip_expense");
  });

  it("defaults counts to 0 when pendingCounts is missing", () => {
    const buckets = mapApprovalWorkbenchBuckets({
      activeType: "trip_expense",
      counts: null,
      onTypeChange: vi.fn(),
    });

    expect(buckets.every((b) => b.count === 0)).toBe(true);
    expect(buckets[0]?.isActive).toBe(true);
  });
});
