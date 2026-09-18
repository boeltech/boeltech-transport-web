import { describe, expect, it } from "vitest";
import {
  canApproveSettlement,
  canDisburse,
  canRejectSettlement,
  canSubmitVobo,
  isSettlementMaker,
  isVoboRequiredForPreview,
  resolveCreateSettlementFeedback,
  resolveCreateCta,
} from "./settlementCta";

describe("settlementCta", () => {
  it("requiere VoBo si el neto alcanza el umbral (default 0)", () => {
    expect(
      isVoboRequiredForPreview({ netAmount: 0, hasManualAdjustments: false }),
    ).toBe(true);
    expect(
      isVoboRequiredForPreview({
        netAmount: 4999.99,
        hasManualAdjustments: false,
        thresholdMxn: 5000,
      }),
    ).toBe(false);
  });

  it("requiere VoBo con ajustes manuales aunque el neto esté bajo el umbral", () => {
    expect(
      isVoboRequiredForPreview({
        netAmount: 100,
        hasManualAdjustments: true,
        thresholdMxn: 5000,
      }),
    ).toBe(true);
  });

  it("elige Pedir VoBo vs Guardar borrador según umbral", () => {
    expect(
      resolveCreateCta({ netAmount: 8000, hasManualAdjustments: false }),
    ).toBe("pedir_vobo");
    expect(
      resolveCreateCta({
        netAmount: 100,
        hasManualAdjustments: false,
        thresholdMxn: 5000,
      }),
    ).toBe("guardar_borrador");
  });

  it("trata createdBy y submittedBy como maker", () => {
    expect(isSettlementMaker({ createdBy: "u1", submittedBy: null }, "u1")).toBe(
      true,
    );
    expect(isSettlementMaker({ createdBy: "u2", submittedBy: "u1" }, "u1")).toBe(
      true,
    );
    expect(isSettlementMaker({ createdBy: "u2", submittedBy: "u3" }, "u1")).toBe(
      false,
    );
  });

  it("no permite ejecutar al maker ni sin permiso execute (multi-user)", () => {
    const draftBypass = {
      status: "draft" as const,
      voboRequired: false,
      createdBy: "maker",
      submittedBy: null,
    };
    expect(
      canDisburse({
        settlement: draftBypass,
        userId: "maker",
        canExecute: true,
        activeExecutorCount: 2,
      }),
    ).toBe(false);
    expect(
      canDisburse({
        settlement: draftBypass,
        userId: "executor",
        canExecute: true,
        activeExecutorCount: 2,
      }),
    ).toBe(true);
    expect(
      canDisburse({
        settlement: { ...draftBypass, status: "approved" },
        userId: "executor",
        canExecute: false,
        activeExecutorCount: 2,
      }),
    ).toBe(false);
  });

  it("D3′: maker puede autorizar/rechazar si activeApproverCount === 1", () => {
    const pending = {
      status: "pending_approval" as const,
      createdBy: "maker",
      submittedBy: "maker",
    };
    expect(
      canApproveSettlement({
        settlement: pending,
        userId: "maker",
        canUpdate: true,
        activeApproverCount: 1,
      }),
    ).toBe(true);
    expect(
      canRejectSettlement({
        settlement: pending,
        userId: "maker",
        canUpdate: true,
        activeApproverCount: 1,
      }),
    ).toBe(true);
    expect(
      canApproveSettlement({
        settlement: pending,
        userId: "maker",
        canUpdate: true,
        activeApproverCount: 2,
      }),
    ).toBe(false);
  });

  it("D3′: maker puede registrar pago si activeExecutorCount === 1", () => {
    const approved = {
      status: "approved" as const,
      voboRequired: true,
      createdBy: "maker",
      submittedBy: "maker",
    };
    expect(
      canDisburse({
        settlement: approved,
        userId: "maker",
        canExecute: true,
        activeExecutorCount: 1,
      }),
    ).toBe(true);
    expect(
      canDisburse({
        settlement: approved,
        userId: "maker",
        canExecute: true,
        activeExecutorCount: 2,
      }),
    ).toBe(false);
  });

  it("Pedir VoBo solo en borrador que lo requiere", () => {
    expect(
      canSubmitVobo({
        settlement: { status: "draft", voboRequired: true },
        canUpdate: true,
      }),
    ).toBe(true);
    expect(
      canSubmitVobo({
        settlement: { status: "draft", voboRequired: false },
        canUpdate: true,
      }),
    ).toBe(false);
    expect(
      canSubmitVobo({
        settlement: { status: "pending_approval", voboRequired: true },
        canUpdate: true,
      }),
    ).toBe(false);
  });

  describe("H6: el aviso post-creación sale del estado devuelto por el API", () => {
    it("avisa degradación cuando se pidió VoBo y volvió un borrador", () => {
      expect(
        resolveCreateSettlementFeedback({
          submitForApproval: true,
          resultStatus: "draft",
        }),
      ).toBe("degraded_to_draft");
    });

    it("confirma envío solo si el API dejó la liquidación por autorizar", () => {
      expect(
        resolveCreateSettlementFeedback({
          submitForApproval: true,
          resultStatus: "pending_approval",
        }),
      ).toBe("submitted_for_approval");
    });

    it("guardar borrador explícito no se anuncia como degradación", () => {
      expect(
        resolveCreateSettlementFeedback({
          submitForApproval: false,
          resultStatus: "draft",
        }),
      ).toBe("saved_as_draft");
    });
  });
});
