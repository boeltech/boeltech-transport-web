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

  it("builds compensation approvals deep link", () => {
    expect(settlementsCompensationApprovalsPath()).toBe(
      "/finance/approvals?type=internal_staff_compensation&status=pending",
    );
  });

  it("defaults all roles to pending (Por liquidar)", () => {
    expect(resolveDefaultWorkbenchBucket()).toBe("pending");
  });
});
