import { describe, expect, it } from "vitest";
import type { FinancialTrendData } from "../../domain/types";
import {
  buildMarginBarSeries,
  computePercentDelta,
  formatPercentDeltaLabel,
  getMarginMonthOverMonthDelta,
  getPreviousClosedMargin,
  marginShareOfRevenue,
  resolveMarginComparison,
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

describe("buildMarginBarSeries", () => {
  it("returns undefined with fewer than 2 periods", () => {
    expect(
      buildMarginBarSeries(
        trend({
          periods: ["2026-03"],
          actual_revenue: [100],
          actual_cost: [40],
        }),
      ),
    ).toBeUndefined();
    expect(buildMarginBarSeries(undefined)).toBeUndefined();
  });

  it("builds up to 6 bars with current + reference flags", () => {
    const series = buildMarginBarSeries(
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
        currentPeriod: "2026-04",
      }),
    );

    expect(series).toHaveLength(6);
    expect(series![5]).toMatchObject({
      period: "2026-04",
      isCurrent: true,
      isReference: false,
      value: 65,
    });
    expect(series![4]).toMatchObject({
      period: "2026-03",
      isCurrent: false,
      isReference: true,
    });
  });
});

describe("resolveMarginComparison — hard rule never MoM full month", () => {
  it("uses period_to_date for % when previous slice exists", () => {
    expect(
      resolveMarginComparison(
        trend({
          periods: ["2026-02", "2026-03"],
          actual_revenue: [100, 120],
          actual_cost: [40, 40],
          periodToDate: {
            day: 17,
            current: {
              from: "2026-03-01",
              to: "2026-03-17",
              actual_revenue: 80,
              actual_cost: 20,
              actual_margin: 60,
              trip_count: 3,
            },
            previous: {
              from: "2026-02-01",
              to: "2026-02-17",
              actual_revenue: 70,
              actual_cost: 20,
              actual_margin: 50,
              trip_count: 2,
            },
          },
        }),
      ),
    ).toEqual({
      kind: "period_delta",
      day: 17,
      previousMonthAbbr: "feb",
      previousAmount: 50,
      delta: { kind: "percent", direction: "up", percent: 20 },
    });
  });

  it("returns first_month when period_to_date.previous is null", () => {
    expect(
      resolveMarginComparison(
        trend({
          periods: ["2026-03"],
          actual_revenue: [100],
          actual_cost: [40],
          periodToDate: {
            day: 10,
            current: {
              from: "2026-03-01",
              to: "2026-03-10",
              actual_revenue: 100,
              actual_cost: 40,
              actual_margin: 60,
              trip_count: 1,
            },
            previous: null,
          },
        }),
      ),
    ).toEqual({ kind: "first_month" });
  });

  it("falls back to closed month without % when period_to_date is absent", () => {
    // Full-month MoM would be +33.3% — must NOT surface as percent.
    expect(
      resolveMarginComparison(
        trend({
          periods: ["2026-02", "2026-03"],
          actual_revenue: [100, 120],
          actual_cost: [40, 40],
        }),
      ),
    ).toEqual({
      kind: "closed_fallback",
      previousMonthTitle: "Febrero",
      previousAmount: 60,
    });
  });
});

describe("getPreviousClosedMargin", () => {
  it("returns previous full-month margin for empty-state copy", () => {
    expect(
      getPreviousClosedMargin(
        trend({
          periods: ["2026-02", "2026-03"],
          actual_revenue: [100, 10],
          actual_cost: [40, 5],
        }),
      ),
    ).toEqual({ monthTitle: "Febrero", amount: 60 });
  });
});

describe("marginShareOfRevenue", () => {
  it("returns null when revenue is 0", () => {
    expect(marginShareOfRevenue(10, 0)).toBeNull();
  });

  it("rounds margin ÷ revenue * 100", () => {
    expect(marginShareOfRevenue(94_830, 412_300)).toBe(23);
  });
});

describe("getMarginMonthOverMonthDelta (isolated / deprecated)", () => {
  it("still compares last two full months (must not be used by scorecard UI)", () => {
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
});
