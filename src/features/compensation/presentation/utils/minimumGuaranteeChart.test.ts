import { describe, expect, it } from "vitest";
import { buildMinimumGuaranteeChart } from "./minimumGuaranteeChart";

describe("buildMinimumGuaranteeChart", () => {
  it("calcula equilibrio = mínimo ÷ tarifa para km", () => {
    const model = buildMinimumGuaranteeChart({
      commissionType: "rate_per_km",
      rateValue: 3,
      minimumGuaranteedAmount: 1500,
    });
    expect(model).not.toBeNull();
    expect(model?.breakEvenValue).toBe(500);
    expect(model?.unit).toBe("km");
    expect(model?.minSegmentPct).toBeGreaterThan(0);
    expect(model?.minSegmentPct).toBeLessThanOrEqual(100);
  });

  it("retorna null sin mínimo o con fijo por viaje", () => {
    expect(
      buildMinimumGuaranteeChart({
        commissionType: "rate_per_km",
        rateValue: 3,
        minimumGuaranteedAmount: 0,
      }),
    ).toBeNull();
    expect(
      buildMinimumGuaranteeChart({
        commissionType: "fixed_per_trip",
        rateValue: 650,
        minimumGuaranteedAmount: 1500,
      }),
    ).toBeNull();
  });
});
