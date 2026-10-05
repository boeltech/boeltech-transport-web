import { describe, expect, it } from "vitest";
import {
  BUCKET_PIPELINE_STATUSES,
  resolveDefaultWorkbenchBucket,
  SETTLEMENT_WORKBENCH_BUCKETS,
  settlementsCompensationApprovalsPath,
} from "./settlementWorkbenchConfig";

describe("settlementWorkbenchConfig", () => {
  it("exposes four navigable KPI buckets without approval", () => {
    expect(SETTLEMENT_WORKBENCH_BUCKETS).toEqual([
      "pending",
      "draft",
      "payable",
      "closed",
    ]);
  });

  it("maps pipeline buckets to settlement statuses", () => {
    expect(BUCKET_PIPELINE_STATUSES.draft).toEqual(["draft", "rejected"]);
    expect(BUCKET_PIPELINE_STATUSES.payable).toEqual(["approved"]);
    expect(BUCKET_PIPELINE_STATUSES.closed).toEqual(["disbursed"]);
  });

  it("builds Por autorizar hub deep link for compensation payments", () => {
    expect(settlementsCompensationApprovalsPath()).toBe(
      "/finance/settlements/pending-approval",
    );
    expect(settlementsCompensationApprovalsPath({ driverId: "emp-9" })).toBe(
      "/finance/settlements/pending-approval?driverId=emp-9",
    );
  });

  it("defaults all roles to pending (Pendientes)", () => {
    expect(resolveDefaultWorkbenchBucket()).toBe("pending");
  });
});
