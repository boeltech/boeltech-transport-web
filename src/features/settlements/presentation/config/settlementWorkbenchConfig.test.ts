import { describe, expect, it } from "vitest";
import {
  SETTLEMENT_WORKBENCH_BUCKETS,
  settlementsApprovalsInboxPath,
  settlementsCompensationApprovalsPath,
  settlementsDriverAdvanceApprovalsPath,
  settlementsPendingApprovalRedirectPath,
} from "./settlementWorkbenchConfig";

describe("settlementWorkbenchConfig", () => {
  it("exposes five navigable KPI buckets including approval", () => {
    expect(SETTLEMENT_WORKBENCH_BUCKETS).toEqual([
      "pending",
      "draft",
      "approval",
      "payable",
      "closed",
    ]);
  });

  it("builds En autorización workbench deep link for compensation payments", () => {
    expect(settlementsCompensationApprovalsPath()).toBe(
      "/finance/settlements?bucket=approval",
    );
    expect(settlementsCompensationApprovalsPath({ driverId: "emp-9" })).toBe(
      "/finance/settlements?bucket=approval&employeeId=emp-9",
    );
    expect(settlementsCompensationApprovalsPath({ employeeId: "emp-9" })).toBe(
      "/finance/settlements?bucket=approval&employeeId=emp-9",
    );
  });

  it("keeps advances on the global Approvals inbox", () => {
    expect(settlementsDriverAdvanceApprovalsPath()).toBe(
      "/finance/approvals?type=driver_advance_request&status=pending",
    );
  });

  it("points review-in-approvals to the global liquidaciones inbox", () => {
    expect(settlementsApprovalsInboxPath()).toBe(
      "/finance/approvals?type=internal_staff_compensation&status=pending",
    );
  });

  it("redirects legacy pending-approval tab to the approval bucket", () => {
    expect(settlementsPendingApprovalRedirectPath()).toBe(
      "/finance/settlements?bucket=approval",
    );
    expect(settlementsPendingApprovalRedirectPath("?driverId=emp-9")).toBe(
      "/finance/settlements?bucket=approval&employeeId=emp-9",
    );
  });
});
