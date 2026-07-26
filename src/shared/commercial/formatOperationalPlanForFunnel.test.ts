import { describe, expect, it } from "vitest";
import { formatOperationalPlanForFunnel } from "./formatOperationalPlanForFunnel";
import type { PublicOperationalPlan } from "./publicOperationalPlan.types";

const esencial: PublicOperationalPlan = {
  code: "operacion_esencial",
  name: "Operación Esencial",
  monthlyPriceCents: 74900,
  annualPriceCents: 764000,
  includedStamps: 120,
  overagePriceCents: 500,
  quotaPolicy: "soft_cap",
  maxUsers: 3,
  maxBranches: 1,
  historyMonths: 6,
  features: { support_tier: "email", units_range: "1-10" },
};

const corporativo: PublicOperationalPlan = {
  code: "operacion_corporativo",
  name: "Operación Corporativo",
  monthlyPriceCents: 399900,
  annualPriceCents: null,
  includedStamps: 1500,
  overagePriceCents: 300,
  quotaPolicy: "soft_cap",
  maxUsers: null,
  maxBranches: null,
  historyMonths: null,
  features: {
    support_tier: "account_manager",
    units_range: "100+",
    list_floor: true,
  },
};

describe("formatOperationalPlanForFunnel", () => {
  it("formats Esencial price and limits from cents", () => {
    const item = formatOperationalPlanForFunnel(esencial);
    expect(item.code).toBe("operacion_esencial");
    expect(item.shortName).toBe("Esencial");
    expect(item.priceAmount).toMatch(/\$\s?749/);
    expect(item.pricePeriod).toBe("/mes");
    expect(item.unitsLabel).toBe("1–10 unidades");
    expect(item.usersBadge).toBe("3");
    expect(item.branchesBadge).toBe("1");
    expect(item.stampsBadge).toBe("120");
    expect(item.usersLabel).toContain("3");
    expect(item.branchesLabel).toContain("1");
  });

  it("formats Corporativo with list_floor and unlimited limits", () => {
    const item = formatOperationalPlanForFunnel(corporativo);
    expect(item.shortName).toBe("Corporativo");
    expect(item.priceAmount.toLowerCase()).toContain("desde");
    expect(item.priceAmount).toMatch(/3[,.]?999|3999/);
    expect(item.usersBadge).toBe("∞");
    expect(item.branchesBadge).toBe("∞");
    expect(item.stampsBadge).toMatch(/^≥/);
    expect(item.usersLabel).toMatch(/ilimitados/i);
    expect(item.branchesLabel).toMatch(/ilimitadas/i);
    expect(item.unitsLabel).toBe("100+ unidades");
  });
});
