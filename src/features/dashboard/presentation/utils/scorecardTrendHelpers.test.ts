import { describe, expect, it } from "vitest";
import type { FinancialTrendData } from "../../domain/types";
import {
  buildMarginSparkSeries,
  computePercentDelta,
  formatPercentDeltaLabel,
  getMarginMonthOverMonthDelta,
} from "./scorecardTrendHelpers";

function trend(
  overrides: Partial<FinancialTrendData> & {
    periods: string[];
    actual_revenue: number[];
    actual_cost: number[];
  },
): FinancialTrendData {
  return {
    budgeted_revenue: overrides.actual_revenue.map(() => 0),
    budgeted_cost: overrides.actual_cost.map(() => 0),
    ...overrides,
  };
}

describe("computePercentDelta", () => {
  it("computes ((current - prev) / prev) * 100 when previous > 0", () => {
    expect(computePercentDelta(108.2, 100)).toEqual({
      kind: "percent",
      direction: "up",
      percent: 8.2,
    });
    expect(computePercentDelta(90, 100)).toEqual({
      kind: "percent",
      direction: "down",
      percent: -10,
    });
    expect(computePercentDelta(50, 50)).toEqual({
      kind: "percent",
      direction: "flat",
      percent: 0,
    });
  });

  it("returns unavailable when previous is 0 (no invented %)", () => {
    expect(computePercentDelta(1_000, 0)).toEqual({ kind: "unavailable" });
    expect(computePercentDelta(0, 0)).toEqual({ kind: "unavailable" });
  });

  it("returns unavailable when previous is negative", () => {
    expect(computePercentDelta(10, -20)).toEqual({ kind: "unavailable" });
  });
});

describe("formatPercentDeltaLabel", () => {
  it("formats signed percent with one decimal when needed", () => {
    expect(formatPercentDeltaLabel(8.2)).toBe("+8.2%");
    expect(formatPercentDeltaLabel(-1)).toBe("−1%");
    expect(formatPercentDeltaLabel(0)).toBe("0%");
  });
});

describe("buildMarginSparkSeries", () => {
  it("returns undefined with fewer than 2 periods", () => {
    expect(
      buildMarginSparkSeries(
        trend({
          periods: ["2026-03"],
          actual_revenue: [100],
          actual_cost: [40],
        }),
      ),
    ).toBeUndefined();
    expect(buildMarginSparkSeries(undefined)).toBeUndefined();
  });

  it("builds revenue − cost series capped at 6 trailing points", () => {
    const series = buildMarginSparkSeries(
      trend({
        periods: [
          "2025-10",
          "2025-11",
          "2025-12",
          "2026-01",
          "2026-02",
          "2026-03",
          "2026-04",
        ],
        actual_revenue: [10, 20, 30, 40, 50, 60, 70],
        actual_cost: [5, 5, 5, 5, 5, 5, 5],
      }),
    );

    // margins = [5, 15, 25, 35, 45, 55, 65] → last 6
    expect(series).toEqual([
      { value: 15 },
      { value: 25 },
      { value: 35 },
      { value: 45 },
      { value: 55 },
      { value: 65 },
    ]);
  });
});

describe("getMarginMonthOverMonthDelta", () => {
  it("compares the last two margin points", () => {
    // margins 60 → 80 → +33.3%
    expect(
      getMarginMonthOverMonthDelta(
        trend({
          periods: ["2026-02", "2026-03"],
          actual_revenue: [100, 120],
          actual_cost: [40, 40],
        }),
      ),
    ).toEqual({
      kind: "percent",
      direction: "up",
      percent: 33.3,
    });
  });

  it("returns null without a comparable series", () => {
    expect(getMarginMonthOverMonthDelta(undefined)).toBeNull();
    expect(
      getMarginMonthOverMonthDelta(
        trend({
          periods: ["2026-03"],
          actual_revenue: [100],
          actual_cost: [40],
        }),
      ),
    ).toBeNull();
  });
});
