import { describe, expect, it } from "vitest";
import {
  canDisburseGreenfield,
  canSubmitGreenfieldVobo,
  isSettlementMaker,
  isVoboRequiredForPreview,
  resolveGreenfieldCreateCta,
} from "./greenfieldCta";

describe("greenfieldCta", () => {
  it("requiere VoBo si el neto alcanza el umbral", () => {
    expect(
      isVoboRequiredForPreview({ netAmount: 5000, hasManualAdjustments: false }),
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
      resolveGreenfieldCreateCta({ netAmount: 8000, hasManualAdjustments: false }),
    ).toBe("pedir_vobo");
    expect(
      resolveGreenfieldCreateCta({ netAmount: 100, hasManualAdjustments: false }),
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

  it("no permite ejecutar al maker ni sin permiso execute", () => {
    const draftBypass = {
      status: "draft" as const,
      voboRequired: false,
      createdBy: "maker",
      submittedBy: null,
    };
    expect(
      canDisburseGreenfield({
        settlement: draftBypass,
        userId: "maker",
        canExecute: true,
      }),
    ).toBe(false);
    expect(
      canDisburseGreenfield({
        settlement: draftBypass,
        userId: "executor",
        canExecute: true,
      }),
    ).toBe(true);
    expect(
      canDisburseGreenfield({
        settlement: { ...draftBypass, status: "approved" },
        userId: "executor",
        canExecute: false,
      }),
    ).toBe(false);
  });

  it("Pedir VoBo solo en borrador que lo requiere", () => {
    expect(
      canSubmitGreenfieldVobo({
        settlement: { status: "draft", voboRequired: true },
        canUpdate: true,
      }),
    ).toBe(true);
    expect(
      canSubmitGreenfieldVobo({
        settlement: { status: "draft", voboRequired: false },
        canUpdate: true,
      }),
    ).toBe(false);
    expect(
      canSubmitGreenfieldVobo({
        settlement: { status: "pending_approval", voboRequired: true },
        canUpdate: true,
      }),
    ).toBe(false);
  });
});
