import { describe, expect, it } from "vitest";
import { formatOperationalPlanForFunnel } from "./formatOperationalPlanForFunnel";
import { OPERATIONAL_PLAN_CATALOG } from "./operationalPlanCatalog";
import {
  mapApiPublicOperationalPlan,
  type PublicOperationalPlan,
} from "./publicOperationalPlan.types";

const micro: PublicOperationalPlan = {
  code: "operacion_micro",
  name: "Operación Micro",
  monthlyPriceCents: 0,
  annualPriceCents: null,
  includedStamps: 0,
  overagePriceCents: 600,
  quotaPolicy: "soft_cap",
  maxUsers: 5,
  maxBranches: 1,
  historyMonths: 12,
  features: { support_tier: "email", units_range: "1-5" },
  pricePerMotrizCents: 38900,
  stampsPerMotriz: 30,
  bandQMin: 1,
  bandQMax: 5,
};

const grande: PublicOperationalPlan = {
  code: "operacion_grande",
  name: "Operación Grande",
  monthlyPriceCents: 0,
  annualPriceCents: null,
  includedStamps: 0,
  overagePriceCents: 300,
  quotaPolicy: "soft_cap",
  maxUsers: null,
  maxBranches: null,
  historyMonths: null,
  features: {
    support_tier: "account_manager",
    units_range: "101+",
  },
  pricePerMotrizCents: null,
  stampsPerMotriz: 30,
  bandQMin: 101,
  bandQMax: null,
};

/** Grandfather flat v3 — sin campos motriz. */
const legacyFlat: PublicOperationalPlan = {
  code: "operacion_crecimiento",
  name: "Operación Crecimiento",
  monthlyPriceCents: 149900,
  annualPriceCents: 1529000,
  includedStamps: 380,
  overagePriceCents: 400,
  quotaPolicy: "soft_cap",
  maxUsers: 10,
  maxBranches: 3,
  historyMonths: 12,
  features: { support_tier: "email", units_range: "11-30" },
  pricePerMotrizCents: null,
  stampsPerMotriz: 0,
  bandQMin: null,
  bandQMax: null,
};

describe("OPERATIONAL_PLAN_CATALOG SoT v5", () => {
  it("exposes micro/pequeña/mediana/grande with motriz prices and capacity matrix", () => {
    expect(OPERATIONAL_PLAN_CATALOG.map((p) => p.code)).toEqual([
      "operacion_micro",
      "operacion_pequena",
      "operacion_mediana",
      "operacion_grande",
    ]);
    expect(OPERATIONAL_PLAN_CATALOG[0]!.priceAmount).toBe("$389");
    expect(OPERATIONAL_PLAN_CATALOG[0]!.pricePeriod).toBe("/motriz · mes");
    expect(OPERATIONAL_PLAN_CATALOG[0]!.usersBadge).toBe("5");
    expect(OPERATIONAL_PLAN_CATALOG[1]!.priceAmount).toBe("$319");
    expect(OPERATIONAL_PLAN_CATALOG[1]!.usersBadge).toBe("15");
    expect(OPERATIONAL_PLAN_CATALOG[2]!.priceAmount).toBe("$299");
    expect(OPERATIONAL_PLAN_CATALOG[2]!.usersBadge).toBe("40");
    expect(OPERATIONAL_PLAN_CATALOG[3]!.priceAmount).toBe("Cotización");
    expect(OPERATIONAL_PLAN_CATALOG[3]!.pricePeriod).toBe("");
  });
});

describe("mapApiPublicOperationalPlan", () => {
  it("maps motriz fields from snake_case API", () => {
    const plan = mapApiPublicOperationalPlan({
      code: "operacion_micro",
      name: "Operación Micro",
      monthly_price_cents: 0,
      annual_price_cents: null,
      included_stamps: 0,
      overage_price_cents: 600,
      quota_policy: "soft_cap",
      max_users: 5,
      max_branches: 1,
      history_months: 12,
      features: { units_range: "1-5" },
      price_per_motriz_cents: 38900,
      stamps_per_motriz: 30,
      band_q_min: 1,
      band_q_max: 5,
    });
    expect(plan.monthlyPriceCents).toBe(0);
    expect(plan.pricePerMotrizCents).toBe(38900);
    expect(plan.stampsPerMotriz).toBe(30);
    expect(plan.bandQMin).toBe(1);
    expect(plan.bandQMax).toBe(5);
  });
});

describe("formatOperationalPlanForFunnel", () => {
  it("shows $389/motriz when monthly=0 and price_per_motriz=38900 (never $0)", () => {
    const item = formatOperationalPlanForFunnel(micro);
    expect(item.code).toBe("operacion_micro");
    expect(item.shortName).toBe("Micro");
    expect(item.priceAmount).toMatch(/\$\s?389/);
    expect(item.priceAmount).not.toMatch(/\$\s?0\b/);
    expect(item.pricePeriod).toBe("/motriz · mes");
    expect(item.unitsLabel).toBe("1–5 unidades");
    expect(item.usersBadge).toBe("5");
    expect(item.branchesBadge).toBe("1");
    expect(item.stampsBadge).toBe("30");
    expect(item.stampsLabel).toBe("30 timbres/motriz");
    expect(item.historyLabel).toBe("12 meses");
  });

  it("formats Grande as Cotización with SOW limits and stamps/motriz", () => {
    const item = formatOperationalPlanForFunnel(grande);
    expect(item.shortName).toBe("Grande");
    expect(item.priceAmount).toBe("Cotización");
    expect(item.pricePeriod).toBe("");
    expect(item.usersBadge).toBe("SOW");
    expect(item.branchesBadge).toBe("SOW");
    expect(item.stampsLabel).toBe("30 timbres/motriz");
    expect(item.unitsLabel).toBe("101+ unidades");
  });

  it("keeps legacy flat $X/mes when monthly>0 and no motriz price", () => {
    const item = formatOperationalPlanForFunnel(legacyFlat);
    expect(item.priceAmount).toMatch(/\$\s?1[,.]?499|1499/);
    expect(item.pricePeriod).toBe("/mes");
    expect(item.stampsLabel).toContain("380");
    expect(item.stampsLabel).toMatch(/timbres\/mes/);
  });

  it("does not show 0 timbres when includedStamps=0 and stampsPerMotriz=0", () => {
    const item = formatOperationalPlanForFunnel({
      ...legacyFlat,
      includedStamps: 0,
      stampsPerMotriz: 0,
    });
    expect(item.stampsBadge).toBe("");
    expect(item.stampsLabel).toBe("");
  });
});
