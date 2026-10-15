import { describe, expect, it } from "vitest";
import { FINANCE_APPROVALS_PATH } from "@features/finance/application";
import { settlementsPendingApprovalPath } from "../../application/settlementsRoutes";
import {
  SETTLEMENT_WORKBENCH_BUCKETS,
  settlementsApprovalsInboxPath,
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

  it("builds En autorización via settlementsPendingApprovalPath (S5-DUP-01)", () => {
    expect(settlementsPendingApprovalPath()).toBe(
      "/finance/settlements?bucket=approval",
    );
    expect(settlementsPendingApprovalPath({ driverId: "emp-9" })).toBe(
      "/finance/settlements?bucket=approval&employeeId=emp-9",
    );
    expect(settlementsPendingApprovalPath({ employeeId: "emp-9" })).toBe(
      "/finance/settlements?bucket=approval&employeeId=emp-9",
    );
  });

  it("keeps advances on the global Approvals inbox", () => {
    expect(settlementsDriverAdvanceApprovalsPath()).toBe(
      `${FINANCE_APPROVALS_PATH}?type=driver_advance_request&status=pending`,
    );
  });

  it("points review-in-approvals to the global liquidaciones inbox", () => {
    expect(settlementsApprovalsInboxPath()).toBe(
      `${FINANCE_APPROVALS_PATH}?type=internal_staff_compensation&status=pending`,
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

