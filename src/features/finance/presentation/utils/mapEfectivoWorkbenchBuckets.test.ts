import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EFECTIVO_BUCKET,
  isEfectivoCobrosBucket,
  mapEfectivoWorkbenchBuckets,
} from "./mapEfectivoWorkbenchBuckets";

describe("mapEfectivoWorkbenchBuckets", () => {
  it("defaults open and accepts open|partial", () => {
    expect(DEFAULT_EFECTIVO_BUCKET).toBe("open");
    expect(isEfectivoCobrosBucket("open")).toBe(true);
    expect(isEfectivoCobrosBucket("partial")).toBe(true);
    expect(isEfectivoCobrosBucket("rep_exceptions")).toBe(false);
  });

  it("exposes count and amount on both buckets and wires clicks", () => {
    const onBucketChange = vi.fn();
    const buckets = mapEfectivoWorkbenchBuckets({
      open: { tripCount: 3, pendingAmount: 15000 },
      partial: { tripCount: 1, pendingAmount: 2500 },
      activeBucket: "open",
      onBucketChange,
    });

    expect(buckets).toHaveLength(2);
    expect(buckets[0]).toMatchObject({
      id: "open",
      label: "Por cobrar",
      count: 3,
      isActive: true,
    });
    expect(buckets[0]?.description).toMatch(/\$/);
    expect(buckets[1]).toMatchObject({
      id: "partial",
      label: "Con abono parcial",
      count: 1,
      isActive: false,
    });
    expect(buckets[1]?.description).toMatch(/\$/);

    buckets[1]?.onClick?.();
    expect(onBucketChange).toHaveBeenCalledWith("partial");
  });
});
