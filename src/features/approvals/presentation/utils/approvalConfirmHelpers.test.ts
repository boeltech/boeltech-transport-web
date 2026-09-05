import { describe, expect, it } from "vitest";
import type { ApprovableItem } from "../../domain";
import {
  formatApprovableApproveConfirmDescription,
  isSelfSubmittedApproval,
} from "./approvalConfirmHelpers";

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

const advanceItem: ApprovableItem = {
  approvableType: "driver_advance_request",
  id: "adv-1",
  amount: 2500,
  currency: "MXN",
  category: "driver_advance_request",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: null,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "driver_advance_request",
    folio: "ANT-2026-099",
    employeeFullName: "Mario Ruiz",
    tripCode: "V-2026-050",
    notes: "Casetas y maniobras",
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

  it("formats advance approval description with folio, operator and dispersion note", () => {
    const text = formatApprovableApproveConfirmDescription(advanceItem);
    expect(text).toContain("ANT-2026-099");
    expect(text).toContain("Mario Ruiz");
    expect(text).toContain("$2,500.00");
    expect(text).toContain("dispersión en Tesorería");
  });

  it("falls back to generic copy when item is null", () => {
    expect(formatApprovableApproveConfirmDescription(null)).toContain(
      "costo real",
    );
  });
});

describe("isSelfSubmittedApproval", () => {
  it("detecta self-submit cuando submittedBy coincide", () => {
    expect(
      isSelfSubmittedApproval(
        { ...advanceItem, submittedBy: "user-1" },
        "user-1",
      ),
    ).toBe(true);
  });

  it("permite cuando submittedBy es null o distinto", () => {
    expect(isSelfSubmittedApproval(advanceItem, "user-1")).toBe(false);
    expect(
      isSelfSubmittedApproval(
        { ...advanceItem, submittedBy: "user-2" },
        "user-1",
      ),
    ).toBe(false);
  });
});
