import { describe, expect, it } from "vitest";
import type { DriverSettlement } from "../../domain/entities";
import {
  partitionSettlementsByClabe,
  partitionSettlementsForBatch,
  summarizeBatchOmits,
} from "./settlementBatchOmit";

function makeSettlement(
  overrides: Partial<DriverSettlement> & Pick<DriverSettlement, "id">,
): DriverSettlement {
  return {
    tenantId: "t1",
    settlementNumber: `PAG-${overrides.id}`,
    settlementKind: "regular",
    employeeId: `emp-${overrides.id}`,
    employeeFullName: "Operador",
    agreementSnapshot: {} as DriverSettlement["agreementSnapshot"],
    periodStart: "2026-11-02",
    periodEnd: "2026-11-08",
    status: "pending_approval",
    totalTripsCommission: 0,
    totalBaseSalary: 0,
    totalReimbursableExpenses: 0,
    totalBonuses: 0,
    totalAdvancesDeducted: 0,
    totalOtherDeductions: 0,
    grossAmount: 1000,
    netAmount: 1000,
    currency: "MXN",
    disbursedAt: null,
    disbursedBy: null,
    disbursementMethod: null,
    disbursementReference: null,
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    notes: null,
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
    createdBy: "user-maker",
    submittedBy: "user-maker",
    approvalRevision: "rev-1",
    ...overrides,
  };
}

const blockedSelfPolicy = {
  advanceApprove: { allowed: false, activeCounterpartCount: 1 },
  advanceDisburse: { allowed: false, activeCounterpartCount: 1 },
  settlementApprove: { allowed: false, activeCounterpartCount: 1 },
  settlementDisburse: { allowed: false, activeCounterpartCount: 1 },
  tripExpenseApprove: { allowed: false, activeCounterpartCount: 1 },
};

describe("partitionSettlementsForBatch R6", () => {
  it("omite self_actor al autorizar lo propio y deja el resto", () => {
    const own = makeSettlement({ id: "a", createdBy: "me", submittedBy: "me" });
    const other = makeSettlement({
      id: "b",
      createdBy: "other",
      submittedBy: "other",
    });

    const result = partitionSettlementsForBatch({
      settlements: [own, other],
      kind: "approve",
      userId: "me",
      selfApprovalPolicy: blockedSelfPolicy,
      canUpdate: true,
      canExecute: true,
    });

    expect(result.eligible.map((s) => s.id)).toEqual(["b"]);
    expect(result.omitted).toHaveLength(1);
    expect(result.omitted[0]?.reasonCode).toBe("self_actor");
  });

  it("omite self_actor al registrar lo propio", () => {
    const own = makeSettlement({
      id: "a",
      status: "approved",
      createdBy: "me",
      submittedBy: "me",
      approvalRevision: "rev-1",
    });
    const other = makeSettlement({
      id: "b",
      status: "approved",
      createdBy: "other",
      submittedBy: "other",
      approvalRevision: "rev-2",
    });

    const result = partitionSettlementsForBatch({
      settlements: [own, other],
      kind: "disburse",
      userId: "me",
      selfApprovalPolicy: blockedSelfPolicy,
      canUpdate: true,
      canExecute: true,
    });

    expect(result.eligible.map((s) => s.id)).toEqual(["b"]);
    expect(result.omitted[0]?.reasonCode).toBe("self_actor");
  });

  it("omite sin approvalRevision en disburse (concurrency)", () => {
    const missing = makeSettlement({
      id: "a",
      status: "approved",
      createdBy: "other",
      approvalRevision: null,
    });

    const result = partitionSettlementsForBatch({
      settlements: [missing],
      kind: "disburse",
      userId: "me",
      selfApprovalPolicy: null,
      canUpdate: true,
      canExecute: true,
    });

    expect(result.eligible).toHaveLength(0);
    expect(result.omitted[0]?.reasonCode).toBe("concurrency");
  });
});

describe("partitionSettlementsByClabe", () => {
  it("separa SPEI vs efectivo solo con boolean hasClabe", () => {
    const withClabe = makeSettlement({ id: "1", employeeId: "e1" });
    const without = makeSettlement({ id: "2", employeeId: "e2" });
    const unknown = makeSettlement({ id: "3", employeeId: "e3" });

    const map = new Map<string, boolean>([
      ["e1", true],
      ["e2", false],
    ]);

    const { spei, cash } = partitionSettlementsByClabe(
      [withClabe, without, unknown],
      map,
    );

    expect(spei.map((s) => s.id)).toEqual(["1", "3"]);
    expect(cash.map((s) => s.id)).toEqual(["2"]);
  });
});

describe("summarizeBatchOmits", () => {
  it("agrupa motivos para el banner", () => {
    const text = summarizeBatchOmits([
      {
        settlementId: "a",
        settlementNumber: "PAG-1",
        employeeFullName: "A",
        reasonCode: "self_actor",
        reason: "Lo armaste tú: no puedes autorizarlo",
      },
      {
        settlementId: "b",
        settlementNumber: "PAG-2",
        employeeFullName: "B",
        reasonCode: "self_actor",
        reason: "Lo armaste tú: no puedes autorizarlo",
      },
    ]);
    expect(text).toContain("Lo armaste tú");
    expect(text).toContain("(2)");
  });
});
