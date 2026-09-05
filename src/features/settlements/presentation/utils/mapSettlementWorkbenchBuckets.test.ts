import { describe, expect, it, vi } from "vitest";
import { mapSettlementWorkbenchBuckets } from "./mapSettlementWorkbenchBuckets";
import type { SettlementWorkbenchSummary } from "../../domain/entities";

const summary: SettlementWorkbenchSummary = {
  pending: 12,
  draft: 3,
  approval: 2,
  payable: 5,
  closed: 280,
  openAdvances: 4,
};

describe("mapSettlementWorkbenchBuckets", () => {
  it("maps triage buckets and marks the active one", () => {
    const onBucketChange = vi.fn();
    const buckets = mapSettlementWorkbenchBuckets({
      summary,
      activeBucket: "payable",
      onBucketChange,
    });

    expect(buckets.find((b) => b.id === "pending")?.count).toBe(12);
    expect(buckets.find((b) => b.id === "payable")?.isActive).toBe(true);
    expect(buckets.find((b) => b.id === "draft")?.isActive).toBe(false);

    buckets.find((b) => b.id === "draft")?.onClick();
    expect(onBucketChange).toHaveBeenCalledWith("draft");
  });

  it("adds bucket descriptions for scorecard helper text", () => {
    const buckets = mapSettlementWorkbenchBuckets({
      summary,
      activeBucket: "pending",
      onBucketChange: vi.fn(),
    });

    expect(buckets.find((b) => b.id === "pending")?.description).toBeTruthy();
    expect(buckets.find((b) => b.id === "draft")?.description).toBeTruthy();
  });

  it("does not include openAdvances (lives in Anticipos scorecard)", () => {
    const buckets = mapSettlementWorkbenchBuckets({
      summary,
      activeBucket: "pending",
      onBucketChange: vi.fn(),
    });

    expect(buckets.find((b) => b.id === "openAdvances")).toBeUndefined();
  });

  it("adds approval as crossLink when count > 0", () => {
    const buckets = mapSettlementWorkbenchBuckets({
      summary,
      activeBucket: "pending",
      onBucketChange: vi.fn(),
    });

    const approval = buckets.find((b) => b.id === "approval");
    expect(approval?.crossLink?.href).toContain("/finance/approvals");
    expect(approval?.count).toBe(2);
    expect(approval?.description).toBeTruthy();
  });

  it("omits approval crossLink when count is 0", () => {
    const buckets = mapSettlementWorkbenchBuckets({
      summary: { ...summary, approval: 0 },
      activeBucket: "pending",
      onBucketChange: vi.fn(),
    });

    expect(buckets.find((b) => b.id === "approval")).toBeUndefined();
  });
});
