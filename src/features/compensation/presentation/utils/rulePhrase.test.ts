import { describe, expect, it } from "vitest";
import { buildRulePhrasePlain } from "./rulePhrase";

describe("buildRulePhrasePlain", () => {
  it("arma frase km con mínimo", () => {
    expect(
      buildRulePhrasePlain({
        routeType: "long_haul",
        commissionType: "rate_per_km",
        rateValue: 3,
        minimumGuaranteedAmount: 1500,
      }),
    ).toMatch(/por km recorrido.*nunca menos de/i);
  });

  it("arma frase fija por viaje", () => {
    expect(
      buildRulePhrasePlain({
        routeType: "local",
        commissionType: "fixed_per_trip",
        rateValue: 650,
        minimumGuaranteedAmount: 0,
      }),
    ).toMatch(/importe fijo/i);
  });
});
