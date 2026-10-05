import { describe, expect, it } from "vitest";
import type { SelfApprovalPolicy } from "@features/approvals";
import {
  canApproveSettlement,
  canDisburse,
  canRejectSettlement,
  canSubmitVobo,
  isSettlementAwaitingDisbursement,
  isSettlementMaker,
  isVoboRequiredForPreview,
  resolveCreateSettlementFeedback,
  resolveCreateCta,
  resolveSettlementApproveUi,
  resolveSettlementDisburseUi,
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

  it("rev. 0.2: umbral null no pide autorización por monto; solo los ajustes manuales la piden", () => {
    expect(
      isVoboRequiredForPreview({
        netAmount: 1_000_000,
        hasManualAdjustments: false,
        thresholdMxn: null,
      }),
    ).toBe(false);
    expect(
      isVoboRequiredForPreview({
        netAmount: 100,
        hasManualAdjustments: true,
        thresholdMxn: null,
      }),
    ).toBe(true);
    expect(
      resolveCreateCta({ netAmount: 50_000, hasManualAdjustments: false, thresholdMxn: null }),
    ).toBe("guardar_borrador");
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

  describe("ADR-0098: autoacción decidida por la política del API", () => {
    const policy = (
      overrides: Partial<Record<"settlementApprove" | "settlementDisburse", boolean>>,
    ): SelfApprovalPolicy => ({
      advanceApprove: { allowed: false, activeCounterpartCount: 1 },
      advanceDisburse: { allowed: false, activeCounterpartCount: 1 },
      settlementApprove: {
        allowed: overrides.settlementApprove ?? false,
        activeCounterpartCount: overrides.settlementApprove ? 0 : 1,
      },
      settlementDisburse: {
        allowed: overrides.settlementDisburse ?? false,
        activeCounterpartCount: overrides.settlementDisburse ? 0 : 1,
      },
      tripExpenseApprove: { allowed: false, activeCounterpartCount: 1 },
    });
    const maker = { createdBy: "maker", submittedBy: "maker" };

    it("quien no armó el corte siempre ve la acción normal", () => {
      expect(resolveSettlementApproveUi(maker, "checker", policy({}))).toBe(
        "normal",
      );
      expect(resolveSettlementDisburseUi(maker, "checker", undefined)).toBe(
        "normal",
      );
    });

    it("maker: self_confirm solo si el API lo permite; si no, blocked_own", () => {
      expect(
        resolveSettlementApproveUi(maker, "maker", policy({ settlementApprove: true })),
      ).toBe("self_confirm");
      expect(resolveSettlementApproveUi(maker, "maker", policy({}))).toBe(
        "blocked_own",
      );
      expect(
        resolveSettlementDisburseUi(
          maker,
          "maker",
          policy({ settlementDisburse: true }),
        ),
      ).toBe("self_confirm");
      expect(
        resolveSettlementDisburseUi(
          maker,
          "maker",
          policy({ settlementApprove: true }),
        ),
      ).toBe("blocked_own");
    });

    it("fail-closed: sin política cargada el maker queda bloqueado", () => {
      expect(resolveSettlementApproveUi(maker, "maker", undefined)).toBe(
        "blocked_own",
      );
    });

    it("autorizar/rechazar: pending_approval + permiso + no blocked_own", () => {
      const pending = { status: "pending_approval" as const };
      expect(
        canApproveSettlement({
          settlement: pending,
          canUpdate: true,
          selfActionUi: "self_confirm",
        }),
      ).toBe(true);
      expect(
        canRejectSettlement({
          settlement: pending,
          canUpdate: true,
          selfActionUi: "normal",
        }),
      ).toBe(true);
      expect(
        canApproveSettlement({
          settlement: pending,
          canUpdate: true,
          selfActionUi: "blocked_own",
        }),
      ).toBe(false);
      expect(
        canApproveSettlement({
          settlement: { status: "approved" },
          canUpdate: true,
          selfActionUi: "normal",
        }),
      ).toBe(false);
    });

    it("registrar pago: estado pagable + execute + no blocked_own", () => {
      const draftBypass = { status: "draft" as const, voboRequired: false };
      expect(isSettlementAwaitingDisbursement(draftBypass)).toBe(true);
      expect(
        isSettlementAwaitingDisbursement({
          status: "approved",
          voboRequired: true,
        }),
      ).toBe(true);
      expect(
        isSettlementAwaitingDisbursement({
          status: "draft",
          voboRequired: true,
        }),
      ).toBe(false);
      expect(
        canDisburse({
          settlement: draftBypass,
          canExecute: true,
          selfActionUi: "normal",
        }),
      ).toBe(true);
      expect(
        canDisburse({
          settlement: draftBypass,
          canExecute: true,
          selfActionUi: "blocked_own",
        }),
      ).toBe(false);
      expect(
        canDisburse({
          settlement: { status: "approved", voboRequired: true },
          canExecute: true,
          selfActionUi: "self_confirm",
        }),
      ).toBe(true);
      expect(
        canDisburse({
          settlement: { status: "approved", voboRequired: true },
          canExecute: false,
          selfActionUi: "normal",
        }),
      ).toBe(false);
    });
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
