import { describe, expect, it } from "vitest";
import {
  formatPlanPriceCents,
  formatPlanSelectLabel,
  isMotrizListPrice,
  resolvePlanDisplayName,
} from "./formatPlanLabel";
import type { PlatformBillingPlan } from "../../domain/entities";

const legacyPlan: PlatformBillingPlan = {
  code: "operacion_esencial",
  name: "Operación Esencial",
  maxUsers: 3,
  maxBranches: 1,
  historyMonths: 6,
  isActive: true,
  monthlyPriceCents: 74900,
  annualPriceCents: 763980,
  includedStamps: 120,
  overagePriceCents: 600,
  quotaPolicy: "soft_cap",
  features: {},
  pricePerMotrizCents: null,
  stampsPerMotriz: 30,
  bandQMin: null,
  bandQMax: null,
};

const motrizPlan: PlatformBillingPlan = {
  code: "operacion_pequena",
  name: "Operación Pequeña",
  maxUsers: 10,
  maxBranches: 3,
  historyMonths: 12,
  isActive: true,
  monthlyPriceCents: 0,
  annualPriceCents: null,
  includedStamps: 0,
  overagePriceCents: 600,
  quotaPolicy: "soft_cap",
  features: {},
  pricePerMotrizCents: 31900,
  stampsPerMotriz: 30,
  bandQMin: 6,
  bandQMax: 30,
};

describe("formatPlanLabel", () => {
  it("formatPlanPriceCents formats MXN from cents with two decimals", () => {
    expect(formatPlanPriceCents(74900)).toMatch(/749\.00/);
  });

  it("formatPlanSelectLabel includes flat price and stamps for legacy", () => {
    expect(formatPlanSelectLabel(legacyPlan)).toContain("Operación Esencial");
    expect(formatPlanSelectLabel(legacyPlan)).toContain("120 timbres");
    expect(formatPlanSelectLabel(legacyPlan)).toContain("/mes");
  });

  it("formatPlanSelectLabel shows $/motriz when published", () => {
    expect(isMotrizListPrice(motrizPlan)).toBe(true);
    const label = formatPlanSelectLabel(motrizPlan);
    expect(label).toContain("Operación Pequeña");
    expect(label).toContain("/motriz");
    expect(label).toContain("30 timbres/motriz");
    expect(label).not.toContain("/mes");
  });

  it("resolvePlanDisplayName prefers catalog name", () => {
    expect(
      resolvePlanDisplayName("operacion_micro", [
        { code: "operacion_micro", name: "Operación Micro" },
      ]),
    ).toBe("Operación Micro");
  });
});
