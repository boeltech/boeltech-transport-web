import { describe, expect, it } from "vitest";
import type { ApprovableItem } from "../../domain";
import { formatApprovableApproveConfirmDescription } from "./approvalConfirmHelpers";

const tripExpenseItem: ApprovableItem = {
  approvableType: "trip_expense",
  id: "exp-1",
  amount: 1200,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: null,
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
    description: "Diesel ruta",
    occurredAt: "2026-06-01T09:00:00.000Z",
  },
};

describe("formatApprovableApproveConfirmDescription", () => {
  it("includes trip, category and amount for trip expenses", () => {
    const text = formatApprovableApproveConfirmDescription(tripExpenseItem);
    expect(text).toContain("V-2026-001");
    expect(text).toContain("Combustible");
    expect(text).toContain("$1,200.00");
    expect(text).toContain("Diesel ruta");
    expect(text).toContain("costo real");
  });

  it("falls back to generic copy when item is null", () => {
    expect(formatApprovableApproveConfirmDescription(null)).toContain(
      "costo real",
    );
  });
});
