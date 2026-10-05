import { describe, expect, it } from "vitest";
import {
  countBulkOutcomes,
  getApprovalGuardCode,
  isIntermediateStep,
  isMultiStepApproval,
  predictBulkApprove,
  queueListFilters,
  resolveApprovableActionUi,
  resolveApprovalActionUi,
  returnReasonCodesFor,
  showsApprovalPolicySignals,
  showsReapprovalSignal,
  type ResolveApprovalActionContext,
} from "./approvalAction";
import type { ApprovalBlock } from "./entities";

function makeApproval(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
  return {
    flowStatus: "in_progress",
    stepCurrent: 1,
    stepsTotal: 2,
    pendingFor: { roles: ["manager"], users: [] },
    signedSteps: [],
    routedBy: {
      tierIndex: 1,
      minAmount: 5000,
      matchedConditions: [],
      policyVersion: 3,
      lazy: false,
    },
    canAct: true,
    cannotActReason: null,
    escalated: false,
    reapproval: null,
    returned: null,
    ...overrides,
  };
}

const baseCtx: ResolveApprovalActionContext = {
  isOwn: false,
  selfPolicy: undefined,
  canDecide: true,
  isPending: true,
  userId: "user-1",
};

describe("resolveApprovalActionUi", () => {
  describe("sin bloque approval (comportamiento previo al motor)", () => {
    it("pendiente y con permiso → act", () => {
      expect(resolveApprovalActionUi(null, baseCtx)).toEqual({
        kind: "act",
        selfConfirm: false,
      });
    });

    it("ya decidida → closed", () => {
      expect(resolveApprovalActionUi(undefined, { ...baseCtx, isPending: false })).toEqual({
        kind: "closed",
      });
    });

    it("propia sin capacidad → own_blocked; con capacidad → act con confirmación", () => {
      expect(
        resolveApprovalActionUi(null, { ...baseCtx, isOwn: true, selfPolicy: { allowed: false } }),
      ).toEqual({ kind: "own_blocked" });
      expect(
        resolveApprovalActionUi(null, { ...baseCtx, isOwn: true, selfPolicy: { allowed: true } }),
      ).toEqual({ kind: "act", selfConfirm: true });
    });

    it("sin permiso → read_only", () => {
      expect(resolveApprovalActionUi(null, { ...baseCtx, canDecide: false })).toEqual({
        kind: "read_only",
      });
    });
  });

  it("Devuelta gana incluso sobre «Enviada por ti»", () => {
    const approval = makeApproval({
      flowStatus: "returned",
      canAct: false,
      cannotActReason: "self_action",
    });
    expect(
      resolveApprovalActionUi(approval, {
        ...baseCtx,
        isOwn: true,
        selfPolicy: { allowed: false },
      }),
    ).toEqual({ kind: "returned" });
  });

  it("«Enviada por ti» gana sobre canAct (fail-closed sin política)", () => {
    expect(
      resolveApprovalActionUi(makeApproval({ canAct: true }), {
        ...baseCtx,
        isOwn: true,
        selfPolicy: undefined,
      }),
    ).toEqual({ kind: "own_blocked" });
  });

  it("cannot_act self_action del API → own_blocked aunque el web no lo detecte", () => {
    expect(
      resolveApprovalActionUi(
        makeApproval({ canAct: false, cannotActReason: "self_action" }),
        baseCtx,
      ),
    ).toEqual({ kind: "own_blocked" });
  });

  it("canAct → act; propia con capacidad pide confirmación", () => {
    expect(resolveApprovalActionUi(makeApproval(), baseCtx)).toEqual({
      kind: "act",
      selfConfirm: false,
    });
    expect(
      resolveApprovalActionUi(makeApproval(), {
        ...baseCtx,
        isOwn: true,
        selfPolicy: { allowed: true },
      }),
    ).toEqual({ kind: "act", selfConfirm: true });
  });

  it("canAct sin permiso web → read_only", () => {
    expect(resolveApprovalActionUi(makeApproval(), { ...baseCtx, canDecide: false })).toEqual({
      kind: "read_only",
    });
  });

  it("already_signed usa el paso que firmó el usuario", () => {
    const approval = makeApproval({
      stepCurrent: 3,
      stepsTotal: 3,
      canAct: false,
      cannotActReason: "already_signed",
      signedSteps: [
        { stepNo: 1, userId: "user-1", fullName: "Yo", role: "manager", decidedAt: null },
        { stepNo: 2, userId: "user-2", fullName: "Otro", role: "accountant", decidedAt: null },
      ],
    });
    expect(resolveApprovalActionUi(approval, baseCtx)).toEqual({
      kind: "already_signed",
      stepNo: 1,
    });
  });

  it("already_signed sin coincidencia cae al paso anterior", () => {
    const approval = makeApproval({
      stepCurrent: 2,
      canAct: false,
      cannotActReason: "already_signed",
    });
    expect(resolveApprovalActionUi(approval, { ...baseCtx, userId: null })).toEqual({
      kind: "already_signed",
      stepNo: 1,
    });
  });

  it("not_eligible → waiting con quién falta", () => {
    const pendingFor = { roles: ["accountant"], users: [] };
    expect(
      resolveApprovalActionUi(
        makeApproval({ canAct: false, cannotActReason: "not_eligible", pendingFor }),
        baseCtx,
      ),
    ).toEqual({ kind: "waiting", pendingFor });
  });

  it("no_active_eligible y no_permission", () => {
    expect(
      resolveApprovalActionUi(
        makeApproval({ canAct: false, cannotActReason: "no_active_eligible" }),
        baseCtx,
      ),
    ).toEqual({ kind: "no_active_eligible" });
    expect(
      resolveApprovalActionUi(
        makeApproval({ canAct: false, cannotActReason: "no_permission" }),
        baseCtx,
      ),
    ).toEqual({ kind: "read_only" });
  });

  it("flujo cerrado → closed", () => {
    for (const flowStatus of ["approved", "rejected", "superseded", "cancelled"] as const) {
      expect(
        resolveApprovalActionUi(makeApproval({ flowStatus, canAct: false }), baseCtx),
      ).toEqual({ kind: "closed" });
    }
  });

  it("not_started (instancia perezosa) se trata como abierto", () => {
    expect(
      resolveApprovalActionUi(makeApproval({ flowStatus: "not_started" }), baseCtx),
    ).toEqual({ kind: "act", selfConfirm: false });
  });
});

describe("resolveApprovableActionUi", () => {
  it("propio = submittedBy y política por concepto", () => {
    const item = {
      approvableType: "trip_expense" as const,
      submittedBy: "user-1",
      status: "pending" as const,
      approval: makeApproval(),
    };
    expect(
      resolveApprovableActionUi(
        item,
        "user-1",
        {
          tripExpenseApprove: { allowed: true, activeCounterpartCount: 1 },
          advanceApprove: { allowed: false, activeCounterpartCount: 1 },
          advanceDisburse: { allowed: false, activeCounterpartCount: 1 },
          settlementApprove: { allowed: false, activeCounterpartCount: 1 },
          settlementDisburse: { allowed: false, activeCounterpartCount: 1 },
        },
        true,
      ),
    ).toEqual({ kind: "act", selfConfirm: true });
    expect(resolveApprovableActionUi(item, "user-1", null, true)).toEqual({
      kind: "own_blocked",
    });
  });
});

describe("visibilidad UX5", () => {
  it("un paso con regla estándar no muestra señales", () => {
    const oneStepStandard = makeApproval({
      stepsTotal: 1,
      routedBy: {
        tierIndex: null,
        minAmount: null,
        matchedConditions: [],
        policyVersion: null,
        lazy: true,
      },
    });
    expect(isMultiStepApproval(oneStepStandard)).toBe(false);
    expect(showsApprovalPolicySignals(oneStepStandard)).toBe(false);
  });

  it("un paso con regla propia muestra señales pero no líneas de paso", () => {
    const oneStepPolicy = makeApproval({ stepsTotal: 1 });
    expect(isMultiStepApproval(oneStepPolicy)).toBe(false);
    expect(showsApprovalPolicySignals(oneStepPolicy)).toBe(true);
  });

  describe("showsReapprovalSignal (UX5 enmendada, excepción UX8)", () => {
    const standardRoutedBy = {
      tierIndex: null,
      minAmount: null,
      matchedConditions: [],
      policyVersion: null,
      lazy: true,
    };
    const reapproval = (
      previousStatus: "approved" | "in_progress" | null,
    ): NonNullable<ApprovalBlock["reapproval"]> => ({
      invalidatedAt: "2026-10-02T20:10:00.000Z",
      previousInstanceId: "inst-0",
      previousStatus,
      changes: [{ field: "amount", from: "8000.00", to: "12000.00" }],
    });
    const standard = (overrides: Partial<ApprovalBlock> = {}) =>
      makeApproval({ stepsTotal: 1, routedBy: standardRoutedBy, ...overrides });

    it("regla estándar + autorización anulada → true (escalada y pasos siguen ocultos)", () => {
      const approval = standard({ reapproval: reapproval("approved"), escalated: true });
      expect(showsReapprovalSignal(approval)).toBe(true);
      expect(showsApprovalPolicySignals(approval)).toBe(false);
      expect(isMultiStepApproval(approval)).toBe(false);
    });

    it("regla estándar + corrección con flujo abierto o sin dato → false", () => {
      expect(showsReapprovalSignal(standard({ reapproval: reapproval("in_progress") }))).toBe(
        false,
      );
      expect(showsReapprovalSignal(standard({ reapproval: reapproval(null) }))).toBe(false);
    });

    it("regla estándar + autorización anulada con diff vacío → true", () => {
      expect(
        showsReapprovalSignal(
          standard({ reapproval: { ...reapproval("approved"), changes: [] } }),
        ),
      ).toBe(true);
    });

    it("regla propia o multipaso → true con cualquier previousStatus", () => {
      for (const status of ["approved", "in_progress", null] as const) {
        expect(
          showsReapprovalSignal(makeApproval({ stepsTotal: 1, reapproval: reapproval(status) })),
        ).toBe(true);
        expect(
          showsReapprovalSignal(
            makeApproval({ routedBy: standardRoutedBy, reapproval: reapproval(status) }),
          ),
        ).toBe(true);
      }
    });

    it("sin reapproval o flujo cerrado/devuelto → false", () => {
      expect(showsReapprovalSignal(standard())).toBe(false);
      expect(showsReapprovalSignal(null)).toBe(false);
      for (const flowStatus of ["approved", "rejected", "returned", "superseded"] as const) {
        expect(
          showsReapprovalSignal(standard({ flowStatus, reapproval: reapproval("approved") })),
        ).toBe(false);
      }
    });

    it("not_started (instancia perezosa) cuenta como abierto", () => {
      expect(
        showsReapprovalSignal(
          standard({ flowStatus: "not_started", reapproval: reapproval("approved") }),
        ),
      ).toBe(true);
    });
  });

  it("isIntermediateStep", () => {
    expect(isIntermediateStep(makeApproval({ stepCurrent: 1, stepsTotal: 2 }))).toBe(true);
    expect(isIntermediateStep(makeApproval({ stepCurrent: 2, stepsTotal: 2 }))).toBe(false);
    expect(isIntermediateStep(makeApproval({ stepCurrent: null }))).toBe(false);
    expect(isIntermediateStep(null)).toBe(false);
  });
});

describe("predictBulkApprove", () => {
  it("12 seleccionadas: 8 quedan autorizadas y 4 pasan al paso 2", () => {
    const final = Array.from({ length: 8 }, () => ({
      approval: makeApproval({ stepCurrent: 1, stepsTotal: 1 }),
    }));
    const intermediate = Array.from({ length: 4 }, () => ({
      approval: makeApproval({ stepCurrent: 1, stepsTotal: 2 }),
    }));
    expect(predictBulkApprove([...final, ...intermediate])).toEqual({
      total: 12,
      willApprove: 8,
      willAdvance: 4,
      nextStep: 2,
    });
  });

  it("sin bloque approval todas quedan autorizadas", () => {
    expect(predictBulkApprove([{ approval: null }, {}])).toEqual({
      total: 2,
      willApprove: 2,
      willAdvance: 0,
      nextStep: null,
    });
  });

  it("nextStep es el menor de los pasos siguientes", () => {
    expect(
      predictBulkApprove([
        { approval: makeApproval({ stepCurrent: 2, stepsTotal: 3 }) },
        { approval: makeApproval({ stepCurrent: 1, stepsTotal: 3 }) },
      ]).nextStep,
    ).toBe(2);
  });
});

describe("countBulkOutcomes", () => {
  it("cuenta por outcome y usa el fallback cuando el API no lo manda", () => {
    expect(
      countBulkOutcomes(
        [{ outcome: "approved" }, { outcome: "step_signed" }, { outcome: undefined }],
        "approved",
      ),
    ).toEqual({ approved: 2, rejected: 0, step_signed: 1, returned: 0 });
  });
});

describe("getApprovalGuardCode", () => {
  it("reconoce las 6 guardas del motor", () => {
    for (const code of [
      "APPROVAL_STEP_CHANGED",
      "APPROVAL_REVISION_CHANGED",
      "APPROVAL_REQUEST_RETURNED",
      "APPROVAL_STEP_NOT_ELIGIBLE",
      "APPROVAL_STEP_ALREADY_SIGNED",
      "APPROVAL_MATERIAL_EDIT_LOCKED",
    ]) {
      expect(getApprovalGuardCode({ code })).toBe(code);
    }
  });

  it("ignora otros códigos y valores no objeto", () => {
    expect(getApprovalGuardCode({ code: "SELF_APPROVAL_FORBIDDEN" })).toBeNull();
    expect(getApprovalGuardCode(new Error("x"))).toBeNull();
    expect(getApprovalGuardCode(null)).toBeNull();
    expect(getApprovalGuardCode("APPROVAL_STEP_CHANGED")).toBeNull();
  });
});

describe("queueListFilters", () => {
  it("«Me toca» = assignedToMe; «Todas» = includeReturned", () => {
    expect(queueListFilters("mine")).toEqual({ assignedToMe: true });
    expect(queueListFilters("all")).toEqual({ includeReturned: true });
  });
});

describe("returnReasonCodesFor", () => {
  it("motivos rápidos por tipo; «Otro» siempre al final", () => {
    expect(returnReasonCodesFor("trip_expense")).toEqual([
      "missing_receipt",
      "wrong_amount",
      "other",
    ]);
    expect(returnReasonCodesFor("driver_advance_request")).toEqual([
      "wrong_amount",
      "wrong_operator",
      "other",
    ]);
    expect(returnReasonCodesFor("internal_staff_compensation")).toEqual([
      "wrong_amount",
      "missing_receipt",
      "other",
    ]);
    expect(returnReasonCodesFor("fuel_transaction")).toEqual(["other"]);
  });
});
