import { describe, expect, it } from "vitest";
import {
  formatPlanPriceCents,
  formatPlanSelectLabel,
  resolvePlanDisplayName,
} from "./formatPlanLabel";
import type { PlatformBillingPlan } from "../../domain/entities";

describe("formatPlanLabel", () => {
  it("formatPlanPriceCents formats MXN from cents with two decimals", () => {
    expect(formatPlanPriceCents(74900)).toMatch(/749\.00/);
  });

  it("formatPlanSelectLabel includes price and stamps", () => {
    const plan: PlatformBillingPlan = {
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
    };

    expect(formatPlanSelectLabel(plan)).toContain("Operación Esencial");
    expect(formatPlanSelectLabel(plan)).toContain("120 timbres");
  });

  it("resolvePlanDisplayName prefers catalog name", () => {
    expect(
      resolvePlanDisplayName("operacion_esencial", [
        { code: "operacion_esencial", name: "Operación Esencial" },
      ]),
    ).toBe("Operación Esencial");
  });
});
