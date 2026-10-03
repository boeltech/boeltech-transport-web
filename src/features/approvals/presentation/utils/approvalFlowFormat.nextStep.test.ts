import { describe, expect, it } from "vitest";
import type { ApprovalBlock } from "../../domain";
import { mapApprovalBlock, type ApiApprovalBlockRaw } from "../../infrastructure/mappers";
import { approvalsCopy } from "../copy/approvalsCopy";
import { commonNextStepLabel, formatNextStepLabel } from "./approvalFlowFormat";

function block(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
  return {
    flowStatus: "in_progress",
    stepCurrent: 1,
    stepsTotal: 2,
    pendingFor: { roles: ["manager"], users: [] },
    signedSteps: [],
    routedBy: {
      tierIndex: 0,
      minAmount: null,
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

const rawBase: ApiApprovalBlockRaw = {
  flow_status: "in_progress",
  step_current: 1,
  steps_total: 2,
  can_act: true,
  cannot_act_reason: null,
};

describe("ADR-0099 next_step (handoff 08b)", () => {
  it("mapea next_step; ausente queda undefined (fallback) y null = sin paso siguiente", () => {
    expect(
      mapApprovalBlock({
        ...rawBase,
        next_step: { step_no: 2, roles: ["accountant"], users: null },
      }).nextStep,
    ).toEqual({ stepNo: 2, roles: ["accountant"], users: [] });
    expect(mapApprovalBlock(rawBase).nextStep).toBeUndefined();
    expect(mapApprovalBlock({ ...rawBase, next_step: null }).nextStep).toBeNull();
  });

  it("formatNextStepLabel nombra el rol del paso siguiente", () => {
    expect(
      formatNextStepLabel(block({ nextStep: { stepNo: 2, roles: ["accountant"], users: [] } })),
    ).toBe("Contador");
    expect(formatNextStepLabel(block())).toBeNull();
  });

  it("commonNextStepLabel solo devuelve el rol si es común a las filas que avanzan", () => {
    const accountant = { approval: block({ nextStep: { stepNo: 2, roles: ["accountant"], users: [] } }) };
    const manager = { approval: block({ nextStep: { stepNo: 2, roles: ["manager"], users: [] } }) };
    const legacy = { approval: block() };
    const lastStep = { approval: block({ stepCurrent: 2 }) };

    expect(commonNextStepLabel([accountant, accountant, lastStep])).toBe("Contador");
    expect(commonNextStepLabel([accountant, manager])).toBeNull();
    expect(commonNextStepLabel([accountant, legacy])).toBeNull();
  });

  it("predicción masiva: «4 pasan al paso 2 · Contador»; sin rol conserva el texto actual", () => {
    expect(
      approvalsCopy.bulkFlow.prediction({
        total: 6,
        approve: 2,
        advance: 4,
        nextStep: 2,
        nextRole: "Contador",
      }),
    ).toBe("6 seleccionadas: 2 quedan autorizadas y 4 pasan al paso 2 · Contador.");
    expect(
      approvalsCopy.bulkFlow.prediction({ total: 6, approve: 2, advance: 4, nextStep: 2 }),
    ).toBe("6 seleccionadas: 2 quedan autorizadas y 4 pasan al paso 2.");
  });

  it("toast de paso firmado nombra el siguiente rol solo si se conoce", () => {
    expect(approvalsCopy.flow.stepSignedToast(1, 2, "Contador")).toBe(
      "Firmaste el paso 1. Falta el paso 2 · Contador.",
    );
    expect(approvalsCopy.flow.stepSignedToast(1, 2)).toBe("Firmaste el paso 1. Falta el paso 2.");
  });
});
