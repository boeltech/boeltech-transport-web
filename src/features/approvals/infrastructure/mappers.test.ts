import { describe, expect, it } from "vitest";
import {
  mapApprovableItem,
  mapApprovalBlock,
  mapApprovalDecisionResponse,
  mapApprovalFieldChanges,
  mapApprovalHistory,
  mapBulkResultResponse,
  mapListApprovalsResponse,
  mapSelfApprovalPolicy,
  type ApiApprovalBlockRaw,
  type ApiApprovableItemRaw,
} from "./mappers";

const tripExpenseRaw: ApiApprovableItemRaw = {
  approvable_type: "trip_expense",
  id: "expense-1",
  amount: 1500,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submitted_at: "2026-06-01T10:00:00.000Z",
  submitted_by: "user-1",
  approved_at: null,
  approved_by: null,
  rejected_at: null,
  rejection_reason: null,
  context: {
    approvable_type: "trip_expense",
    trip_id: "trip-1",
    trip_code: "V-2026-001",
    driver_id: "driver-1",
    driver_full_name: "Juan Pérez",
    vehicle_id: "vehicle-1",
    vehicle_unit_number: "T-101",
    expense_category: "fuel",
    description: "Carga de diesel",
    occurred_at: "2026-06-01T09:00:00.000Z",
  },
};

describe("mapApprovableItem", () => {
  it("maps snake_case item with trip expense context", () => {
    const item = mapApprovableItem(tripExpenseRaw);

    expect(item.approvableType).toBe("trip_expense");
    expect(item.amount).toBe(1500);
    expect(item.context.approvableType).toBe("trip_expense");
    if (item.context.approvableType === "trip_expense") {
      expect(item.context.tripCode).toBe("V-2026-001");
      expect(item.context.driverFullName).toBe("Juan Pérez");
    }
  });
});

describe("mapListApprovalsResponse", () => {
  it("normalizes page_size pagination to limit/totalPages", () => {
    const mapped = mapListApprovalsResponse({
      data: [tripExpenseRaw],
      pagination: {
        page: 2,
        page_size: 25,
        total: 40,
        total_pages: 2,
      },
    });

    expect(mapped.pagination.page).toBe(2);
    expect(mapped.pagination.limit).toBe(25);
    expect(mapped.pagination.total).toBe(40);
    expect(mapped.pagination.totalPages).toBe(2);
    expect(mapped.data).toHaveLength(1);
  });
});

describe("mapApprovableItem self_approved (ADR-0098)", () => {
  it("mapea self_approved=true", () => {
    expect(mapApprovableItem({ ...tripExpenseRaw, self_approved: true }).selfApproved).toBe(
      true,
    );
  });

  it("ausente o no booleano queda en false", () => {
    expect(mapApprovableItem(tripExpenseRaw).selfApproved).toBe(false);
  });
});

describe("mapSelfApprovalPolicy (ADR-0098)", () => {
  it("mapea los cinco conceptos snake_case → camelCase", () => {
    const policy = mapSelfApprovalPolicy({
      advance_approve: { allowed: true, active_counterpart_count: 0 },
      advance_disburse: { allowed: false, active_counterpart_count: 2 },
      settlement_approve: { allowed: true, active_counterpart_count: 0 },
      settlement_disburse: { allowed: false, active_counterpart_count: 1 },
      trip_expense_approve: { allowed: false, active_counterpart_count: 3 },
    });

    expect(policy).toEqual({
      advanceApprove: { allowed: true, activeCounterpartCount: 0 },
      advanceDisburse: { allowed: false, activeCounterpartCount: 2 },
      settlementApprove: { allowed: true, activeCounterpartCount: 0 },
      settlementDisburse: { allowed: false, activeCounterpartCount: 1 },
      tripExpenseApprove: { allowed: false, activeCounterpartCount: 3 },
    });
  });

  it("falla cerrado: conceptos ausentes o respuesta nula quedan no permitidos", () => {
    const policy = mapSelfApprovalPolicy({
      advance_approve: { allowed: true, active_counterpart_count: 0 },
    });
    expect(policy.advanceApprove.allowed).toBe(true);
    expect(policy.settlementApprove).toEqual({ allowed: false, activeCounterpartCount: 0 });
    expect(policy.tripExpenseApprove.allowed).toBe(false);

    const empty = mapSelfApprovalPolicy(null);
    expect(Object.values(empty).every((entry) => entry.allowed === false)).toBe(true);
  });
});

const approvalBlockRaw: ApiApprovalBlockRaw = {
  flow_status: "in_progress",
  step_current: 2,
  steps_total: 2,
  pending_for: {
    roles: ["accountant"],
    users: [{ user_id: "user-marta", full_name: "Marta López" }],
  },
  signed_steps: [
    {
      step_no: 1,
      user_id: "user-ana",
      full_name: "Ana López",
      role: "manager",
      decided_at: "2026-10-01T18:00:00.000Z",
    },
  ],
  routed_by: {
    tier_index: 1,
    min_amount: 5000,
    matched_conditions: ["missing_cfdi"],
    policy_version: 3,
    lazy: false,
  },
  can_act: false,
  cannot_act_reason: "already_signed",
  escalated: false,
  reapproval: {
    invalidated_at: "2026-10-01T17:00:00.000Z",
    previous_instance_id: "inst-0",
    diff: [{ field: "amount", from: 4000, to: 6000 }, { nope: true }],
  },
  returned: null,
};

describe("mapApprovalBlock (ADR-0099)", () => {
  it("mapea el bloque approval a camelCase", () => {
    expect(mapApprovalBlock(approvalBlockRaw)).toEqual({
      flowStatus: "in_progress",
      stepCurrent: 2,
      stepsTotal: 2,
      pendingFor: {
        roles: ["accountant"],
        users: [{ userId: "user-marta", fullName: "Marta López" }],
      },
      signedSteps: [
        {
          stepNo: 1,
          userId: "user-ana",
          fullName: "Ana López",
          role: "manager",
          decidedAt: "2026-10-01T18:00:00.000Z",
        },
      ],
      routedBy: {
        tierIndex: 1,
        minAmount: 5000,
        matchedConditions: ["missing_cfdi"],
        policyVersion: 3,
        lazy: false,
      },
      canAct: false,
      cannotActReason: "already_signed",
      escalated: false,
      reapproval: {
        invalidatedAt: "2026-10-01T17:00:00.000Z",
        previousInstanceId: "inst-0",
        changes: [{ field: "amount", from: 4000, to: 6000 }],
      },
      returned: null,
    });
  });

  it("valores desconocidos caen a defaults seguros", () => {
    const block = mapApprovalBlock({
      flow_status: "weird",
      step_current: null,
      steps_total: 0,
      can_act: false,
      cannot_act_reason: "mystery",
    });
    expect(block.flowStatus).toBe("in_progress");
    expect(block.stepsTotal).toBe(1);
    expect(block.cannotActReason).toBe("closed");
    expect(block.pendingFor).toEqual({ roles: [], users: [] });
    expect(block.signedSteps).toEqual([]);
    expect(block.routedBy.policyVersion).toBeNull();
    expect(block.reapproval).toBeNull();
  });

  it("devuelta: mapea motivo, código y quién", () => {
    const block = mapApprovalBlock({
      ...approvalBlockRaw,
      flow_status: "returned",
      cannot_act_reason: "returned",
      returned: {
        reason: "Falta el ticket",
        reason_code: "missing_receipt",
        returned_by: "user-ana",
        returned_by_name: "Ana López",
        returned_at: "2026-10-01T19:00:00.000Z",
      },
    });
    expect(block.returned).toEqual({
      reason: "Falta el ticket",
      reasonCode: "missing_receipt",
      returnedBy: "user-ana",
      returnedByName: "Ana López",
      returnedAt: "2026-10-01T19:00:00.000Z",
    });
  });
});

describe("mapApprovableItem approval (ADR-0099)", () => {
  it("API previo sin bloque: no agrega la llave approval", () => {
    const item = mapApprovableItem(tripExpenseRaw);
    expect("approval" in item).toBe(false);
    expect(item.approvalRevision).toBeNull();
  });

  it("mapea approval_revision y approval", () => {
    const item = mapApprovableItem({
      ...tripExpenseRaw,
      approval_revision: "rev-9",
      approval: approvalBlockRaw,
    });
    expect(item.approvalRevision).toBe("rev-9");
    expect(item.approval?.stepCurrent).toBe(2);
  });

  it("approval null se conserva como null", () => {
    expect(mapApprovableItem({ ...tripExpenseRaw, approval: null }).approval).toBeNull();
  });
});

describe("mapApprovalFieldChanges", () => {
  it("solo conserva entradas { field, from, to }", () => {
    expect(
      mapApprovalFieldChanges([
        { field: "category", from: "fuel", to: "tolls" },
        { field: "", from: 1, to: 2 },
        null,
        "x",
      ]),
    ).toEqual([{ field: "category", from: "fuel", to: "tolls" }]);
    expect(mapApprovalFieldChanges({ amount: 1 })).toEqual([]);
  });
});

describe("mapApprovalDecisionResponse", () => {
  it("expone outcome válido y el mensaje", () => {
    const result = mapApprovalDecisionResponse({
      data: { ...tripExpenseRaw, outcome: "step_signed" },
      message: "Gasto aprobado",
    });
    expect(result.outcome).toBe("step_signed");
    expect(result.message).toBe("Gasto aprobado");
    expect(result.data.id).toBe("expense-1");
  });

  it("outcome desconocido o ausente → null", () => {
    expect(
      mapApprovalDecisionResponse({ data: { ...tripExpenseRaw, outcome: "boom" } }).outcome,
    ).toBeNull();
    expect(mapApprovalDecisionResponse({ data: tripExpenseRaw }).outcome).toBeNull();
  });
});

describe("mapBulkResultResponse", () => {
  it("mapea outcome por éxito y details por falla", () => {
    const result = mapBulkResultResponse({
      successes: [
        { type: "trip_expense", id: "e1", item: tripExpenseRaw, outcome: "step_signed" },
        { type: "trip_expense", id: "e2", item: tripExpenseRaw },
      ],
      failures: [
        {
          type: "trip_expense",
          id: "e3",
          error: {
            code: "APPROVAL_STEP_CHANGED",
            message: "step changed",
            details: { expected_step: 1 },
          },
        },
      ],
    });
    expect(result.successes[0].outcome).toBe("step_signed");
    expect("outcome" in result.successes[1]).toBe(false);
    expect(result.failures[0].error).toEqual({
      code: "APPROVAL_STEP_CHANGED",
      message: "step changed",
      details: { expected_step: 1 },
    });
  });
});

describe("mapApprovalHistory", () => {
  it("mapea eventos con actor, paso, motivo y cambios", () => {
    expect(
      mapApprovalHistory([
        {
          id: "ev-1",
          instance_id: "inst-1",
          step_no: 1,
          event_type: "returned",
          actor_id: "user-ana",
          actor_name: "Ana López",
          actor_role: "manager",
          reason: "Falta el ticket",
          reason_code: "missing_receipt",
          diff: [{ field: "amount", from: 1, to: 2 }],
          policy_version_id: "pv-3",
          policy_version: 3,
          created_at: "2026-10-01T19:00:00.000Z",
        },
      ]),
    ).toEqual([
      {
        id: "ev-1",
        instanceId: "inst-1",
        stepNo: 1,
        eventType: "returned",
        actorId: "user-ana",
        actorName: "Ana López",
        actorRole: "manager",
        reason: "Falta el ticket",
        reasonCode: "missing_receipt",
        changes: [{ field: "amount", from: 1, to: 2 }],
        policyVersionId: "pv-3",
        policyVersion: 3,
        createdAt: "2026-10-01T19:00:00.000Z",
      },
    ]);
  });
});
