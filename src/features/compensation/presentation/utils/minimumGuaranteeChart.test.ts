import { describe, expect, it } from "vitest";
import {
  buildMinimumGuaranteeChart,
  collapseOverlappingTicks,
  MIN_TICK_GAP_PCT,
} from "./minimumGuaranteeChart";

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

  it("A8: con equilibrio bajo colapsa ticks cercanos y conserva el equilibrio", () => {
    // mínimo 400 / $3 = ~133 km → midLow cerca de 0 y del equilibrio
    const model = buildMinimumGuaranteeChart({
      commissionType: "rate_per_km",
      rateValue: 3,
      minimumGuaranteedAmount: 400,
    });
    expect(model).not.toBeNull();
    const ticks = model!.ticks;
    expect(ticks.some((t) => t.keep)).toBe(true);
    for (let i = 1; i < ticks.length; i += 1) {
      const gap = ticks[i]!.positionPct - ticks[i - 1]!.positionPct;
      const bothMust =
        (ticks[i]!.keep || ticks[i]!.positionPct >= 99.5) &&
        (ticks[i - 1]!.keep || ticks[i - 1]!.positionPct <= 0.5);
      if (!bothMust) {
        expect(gap).toBeGreaterThanOrEqual(MIN_TICK_GAP_PCT - 0.01);
      }
    }
  });

  it("collapseOverlappingTicks suelta mids pero no el keep", () => {
    const collapsed = collapseOverlappingTicks([
      { positionPct: 0, label: "0", amountLabel: "" },
      { positionPct: 5, label: "mid", amountLabel: "$1" },
      { positionPct: 8, label: "eq", amountLabel: "$2", keep: true },
      { positionPct: 100, label: "max", amountLabel: "$9" },
    ]);
    expect(collapsed.map((t) => t.label)).toEqual(["0", "eq", "max"]);
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
