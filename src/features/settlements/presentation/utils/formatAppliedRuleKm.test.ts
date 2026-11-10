import { describe, expect, it } from "vitest";
import {
  formatKmTimesRateRule,
  parseRatePerKmFromAppliedRule,
} from "./formatAppliedRuleKm";

describe("formatAppliedRuleKm (C20)", () => {
  it("parsea $N/km de applied_rule", () => {
    expect(parseRatePerKmFromAppliedRule("Tarifa por km ($3/km)")).toBe(3);
    expect(parseRatePerKmFromAppliedRule("Tarifa foránea $3.5/km")).toBe(3.5);
    expect(parseRatePerKmFromAppliedRule("15% del flete")).toBeNull();
  });

  it("compone km × $ cuando hay distancia y tarifa parseable", () => {
    expect(
      formatKmTimesRateRule({
        distanceKm: 248,
        ratePerKm: undefined,
        appliedRule: "Tarifa por km ($3/km)",
        formatRate: (n) => `$${n.toFixed(2)}`,
        compose: (km, rate) => `${km} km × ${rate}`,
        fallback: "—",
      }),
    ).toBe("248 km × $3.00");
  });

  it("usa ratePerKm del DTO si existe", () => {
    expect(
      formatKmTimesRateRule({
        distanceKm: 100,
        ratePerKm: 4.25,
        appliedRule: null,
        formatRate: (n) => `$${n.toFixed(2)}`,
        compose: (km, rate) => `${km} km × ${rate}`,
        fallback: "—",
      }),
    ).toBe("100 km × $4.25");
  });
});
