import { describe, expect, it } from "vitest";
import { OPERATIONAL_PLAN_CATALOG } from "@shared/commercial/operationalPlanCatalog";
import { DEFAULT_OPERATIONAL_PLAN_CODE } from "@shared/commercial/recommendOperationalPlan";
import { registerFunnelCopy } from "./registerFunnelCopy";

const SOT_V5_CODES = [
  "operacion_micro",
  "operacion_pequena",
  "operacion_mediana",
  "operacion_grande",
] as const;

const LEGACY_V3 = /Esencial|Crecimiento|Escala|Corporativo|operacion_esencial/;

function flattenCopy(value: unknown): string {
  return JSON.stringify(value);
}

describe("registerFunnelCopy SoT v5", () => {
  it("defaults undeclared fleet to Micro (not Esencial)", () => {
    expect(registerFunnelCopy.plan.fleetNone).toMatch(/Micro/i);
    expect(registerFunnelCopy.plan.fleetNone).not.toMatch(/Esencial/i);
    expect(DEFAULT_OPERATIONAL_PLAN_CODE).toBe("operacion_micro");
  });

  it("marks plan preference as orientative and does not sell the select as purchase", () => {
    expect(registerFunnelCopy.plan.planHint.toLowerCase()).toMatch(
      /orientativ/,
    );
    expect(registerFunnelCopy.plan.planHint).toMatch(/Q_fact/);
    expect(registerFunnelCopy.plan.planHint).toMatch(/Micro/);
    expect(registerFunnelCopy.plan.priceNote.toLowerCase()).toMatch(
      /no compra/,
    );
    expect(registerFunnelCopy.plan.orientativeBadge).toMatch(/Orientativ/i);
    expect(registerFunnelCopy.confirm.serverNote).toMatch(/Micro/);
    expect(registerFunnelCopy.confirm.serverNote.toLowerCase()).toMatch(
      /orientativ/,
    );
  });

  it("does not use v3 Esencial/Crecimiento/Escala/Corporativo labels", () => {
    expect(flattenCopy(registerFunnelCopy)).not.toMatch(LEGACY_V3);
  });

  it("preview copy anchors price to motriz (not flat /mes alone)", () => {
    expect(registerFunnelCopy.plan.priceListLabel.toLowerCase()).toMatch(
      /motriz/,
    );
    expect(registerFunnelCopy.plan.priceNote.toLowerCase()).not.toMatch(
      /según el plan elegido/,
    );
  });
});

describe("register funnel catalog consumer (F1 formatter shape)", () => {
  it("selector codes are SoT v5 only", () => {
    expect(OPERATIONAL_PLAN_CATALOG.map((p) => p.code)).toEqual([
      ...SOT_V5_CODES,
    ]);
  });

  it("preview Micro shows $/motriz + cupos + 30 timbres/motriz (never $749)", () => {
    const micro = OPERATIONAL_PLAN_CATALOG.find(
      (p) => p.code === DEFAULT_OPERATIONAL_PLAN_CODE,
    )!;
    expect(micro.pricePeriod).toBe("/motriz · mes");
    expect(micro.priceAmount).toMatch(/\$\s?389/);
    expect(micro.priceAmount).not.toMatch(/\$\s?749/);
    expect(micro.pricePeriod).not.toBe("/mes");
    expect(micro.stampsLabel.toLowerCase()).toMatch(/timbres\/motriz/);
    expect(micro.stampsBadge).toBe("30");
    expect(micro.usersLabel).toMatch(/5/);
    expect(micro.branchesLabel).toMatch(/1/);
    expect(micro.unitsLabel).toBeTruthy();
  });
});
