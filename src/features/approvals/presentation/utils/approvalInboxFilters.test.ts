import { describe, expect, it } from "vitest";
import type { ApprovableItem } from "../../domain";
import {
  APPROVAL_STATUS_ALL,
  buildApprovalEmptyState,
  hasApprovalUserFilters,
  resolveTripFilterLabel,
} from "./approvalInboxFilters";

const tripExpenseItem: ApprovableItem = {
  approvableType: "trip_expense",
  id: "exp-1",
  amount: 100,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: "u1",
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "trip_expense",
    tripId: "trip-1",
    tripCode: "V-2026-001",
    driverId: null,
    driverFullName: null,
    vehicleId: null,
    vehicleUnitNumber: null,
    expenseCategory: "fuel",
    description: "Diesel",
    occurredAt: "2026-06-01T09:00:00.000Z",
  },
};

describe("approvalInboxFilters", () => {
  it("treats status=all as a user filter without forcing pending", () => {
    expect(
      hasApprovalUserFilters({
        search: "",
        status: APPROVAL_STATUS_ALL,
        category: "",
        fromDate: "",
        toDate: "",
        context: {
          tripId: null,
          tripCode: null,
          driverId: null,
          vehicleId: null,
        },
      }),
    ).toBe(true);
  });

  it("does not treat default pending-only view as user filters", () => {
    expect(
      hasApprovalUserFilters({
        search: "",
        status: "pending",
        category: "",
        fromDate: "",
        toDate: "",
        context: {
          tripId: null,
          tripCode: null,
          driverId: null,
          vehicleId: null,
        },
      }),
    ).toBe(false);
  });

  it("resolves trip label from URL tripCode first", () => {
    expect(
      resolveTripFilterLabel("trip-1", "V-FROM-URL", []),
    ).toBe("V-FROM-URL");
  });

  it("resolves trip label from loaded items when URL has only tripId", () => {
    expect(resolveTripFilterLabel("trip-1", null, [tripExpenseItem])).toBe(
      "V-2026-001",
    );
  });

  it("builds clear empty state when no user filters", () => {
    const state = buildApprovalEmptyState(false, null);
    expect(state.title).toBeTruthy();
    expect(state.description).toContain("pendientes");
  });
});
