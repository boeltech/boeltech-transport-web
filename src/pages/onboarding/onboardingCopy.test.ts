import { describe, expect, it } from "vitest";
import { OPERATIONAL_PLAN_CATALOG } from "@shared/commercial/operationalPlanCatalog";
import { DEFAULT_OPERATIONAL_PLAN_CODE } from "@shared/commercial/recommendOperationalPlan";
import { onboardingCopy } from "./onboardingCopy";

const LEGACY_V3 = /Esencial|Crecimiento|Escala|Corporativo|operacion_esencial/;

describe("onboardingCopy SoT v5", () => {
  it("frames plan as preference and points real state to Tu plan", () => {
    expect(onboardingCopy.plan.preferredTitle.toLowerCase()).toMatch(
      /preferencia/,
    );
    expect(onboardingCopy.plan.orientativeBadge).toMatch(/Orientativ/i);
    expect(onboardingCopy.plan.serverBody.toLowerCase()).toMatch(/orientativ/);
    expect(onboardingCopy.plan.serverBody).toMatch(/Micro/);
    expect(onboardingCopy.plan.serverBody).toMatch(/Q_fact/);
    expect(onboardingCopy.plan.serverBody).toMatch(/Tu plan/);
    expect(onboardingCopy.plan.ctaSubscription).toMatch(/Tu plan/);
  });

  it("does not use v3 Esencial/Crecimiento/Escala/Corporativo labels", () => {
    expect(JSON.stringify(onboardingCopy)).not.toMatch(LEGACY_V3);
  });

  it("capacity copy is orientative list from catalog (motriz, not flat $749)", () => {
    expect(onboardingCopy.plan.limitsTitle.toLowerCase()).toMatch(
      /orientativ/,
    );
    const micro = OPERATIONAL_PLAN_CATALOG.find(
      (p) => p.code === DEFAULT_OPERATIONAL_PLAN_CODE,
    )!;
    expect(micro.priceLabel.toLowerCase()).toMatch(/motriz/);
    expect(micro.priceLabel).not.toMatch(/\$\s?749/);
    expect(micro.stampsLabel.toLowerCase()).toMatch(/timbres\/motriz/);
  });
});
