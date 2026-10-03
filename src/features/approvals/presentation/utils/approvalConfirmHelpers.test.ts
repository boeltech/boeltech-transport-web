import { describe, expect, it } from "vitest";
import {
  resolveApprovableSelfActionUi,
  type ApprovableItem,
  type SelfApprovalConcept,
  type SelfApprovalPolicy,
} from "../../domain";
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

describe("resolveApprovableSelfActionUi (ADR-0098)", () => {
  const compensationItem: ApprovableItem = {
    ...advanceItem,
    approvableType: "internal_staff_compensation",
    category: "internal_staff_compensation",
    submittedBy: "user-1",
    context: {
      approvableType: "internal_staff_compensation",
      settlementNumber: "LIQ-1",
      employeeFullName: "Op",
      tripsCount: 1,
    },
  };

  const policy = (allowed: Partial<Record<SelfApprovalConcept, boolean>>) =>
    ({
      advanceApprove: { allowed: allowed.advanceApprove ?? false, activeCounterpartCount: 0 },
      advanceDisburse: { allowed: allowed.advanceDisburse ?? false, activeCounterpartCount: 0 },
      settlementApprove: { allowed: allowed.settlementApprove ?? false, activeCounterpartCount: 0 },
      settlementDisburse: { allowed: allowed.settlementDisburse ?? false, activeCounterpartCount: 0 },
      tripExpenseApprove: { allowed: allowed.tripExpenseApprove ?? false, activeCounterpartCount: 0 },
    }) satisfies SelfApprovalPolicy;

  it("normal cuando el ítem no es propio (submittedBy null o distinto)", () => {
    expect(resolveApprovableSelfActionUi(advanceItem, "user-1", policy({}))).toBe(
      "normal",
    );
    expect(
      resolveApprovableSelfActionUi(
        { ...advanceItem, submittedBy: "user-2" },
        "user-1",
        policy({}),
      ),
    ).toBe("normal");
  });

  it("blocked_own en liquidación propia cuando el API no lo permite", () => {
    expect(
      resolveApprovableSelfActionUi(compensationItem, "user-1", policy({})),
    ).toBe("blocked_own");
  });

  it("self_confirm en liquidación propia con settlementApprove.allowed", () => {
    expect(
      resolveApprovableSelfActionUi(
        compensationItem,
        "user-1",
        policy({ settlementApprove: true }),
      ),
    ).toBe("self_confirm");
  });

  it("usa el concepto del tipo: anticipo propio depende de advanceApprove", () => {
    const ownAdvance = { ...advanceItem, submittedBy: "user-1" };
    expect(
      resolveApprovableSelfActionUi(
        ownAdvance,
        "user-1",
        policy({ settlementApprove: true }),
      ),
    ).toBe("blocked_own");
    expect(
      resolveApprovableSelfActionUi(
        ownAdvance,
        "user-1",
        policy({ advanceApprove: true }),
      ),
    ).toBe("self_confirm");
  });

  it("gasto propio depende de tripExpenseApprove", () => {
    const ownExpense = { ...tripExpenseItem, submittedBy: "user-1" };
    expect(
      resolveApprovableSelfActionUi(
        ownExpense,
        "user-1",
        policy({ tripExpenseApprove: true }),
      ),
    ).toBe("self_confirm");
  });

  it("fail-closed: sin política cargada el ítem propio queda bloqueado", () => {
    expect(
      resolveApprovableSelfActionUi(compensationItem, "user-1", undefined),
    ).toBe("blocked_own");
  });
});
