import { describe, expect, it } from "vitest";
import type { MonthlyPerformance, PeriodFinancials } from "@features/finance/domain";
import {
  alignPerformanceMonths,
  computeMarginPct,
  computeVariation,
  getInProgressPeriod,
  hasAnyPeriodActivity,
  shiftPeriod,
  summarizePeriods,
  variationSentiment,
} from "./monthlyPerformance";

function period(
  key: string,
  revenue: number,
  cost: number,
  tripCount = revenue || cost ? 1 : 0,
): PeriodFinancials {
  return {
    period: key,
    actualRevenue: revenue,
    actualCost: cost,
    actualMargin: revenue - cost,
    tripCount,
  };
}

describe("computeVariation", () => {
  it("computes delta and percentage against the previous year", () => {
    expect(computeVariation(1200, 1000)).toEqual({
      kind: "change",
      delta: 200,
      pct: 20,
    });
    expect(computeVariation(500, 1000)).toEqual({
      kind: "change",
      delta: -500,
      pct: -50,
    });
  });

  it("never divides by zero: previous 0 is «new», both 0 is «none»", () => {
    const fresh = computeVariation(800, 0);
    expect(fresh).toEqual({ kind: "new", delta: 800, pct: null });

    const none = computeVariation(0, 0);
    expect(none).toEqual({ kind: "none", delta: 0, pct: null });

    for (const variation of [fresh, none]) {
      expect(Number.isFinite(variation.pct ?? 0)).toBe(true);
    }
  });

  it("uses the absolute previous value so a recovered loss reads as improvement", () => {
    const variation = computeVariation(100, -200);
    expect(variation.delta).toBe(300);
    expect(variation.pct).toBe(150);
  });
});

describe("variationSentiment", () => {
  it("treats cost increases as negative and revenue increases as positive", () => {
    const up = computeVariation(1200, 1000);
    expect(variationSentiment(up, "higher-is-better")).toBe("positive");
    expect(variationSentiment(up, "lower-is-better")).toBe("negative");

    const down = computeVariation(800, 1000);
    expect(variationSentiment(down, "higher-is-better")).toBe("negative");
    expect(variationSentiment(down, "lower-is-better")).toBe("positive");
  });

  it("is neutral without change or comparison data", () => {
    expect(variationSentiment(computeVariation(0, 0), "higher-is-better")).toBe(
      "neutral",
    );
    expect(variationSentiment(computeVariation(500, 500), "lower-is-better")).toBe(
      "neutral",
    );
  });
});

describe("computeMarginPct", () => {
  it("returns null instead of Infinity/NaN when there is no revenue", () => {
    expect(computeMarginPct(400, 1000)).toBe(40);
    expect(computeMarginPct(-200, 0)).toBeNull();
    expect(computeMarginPct(0, 0)).toBeNull();
  });
});

describe("summarizePeriods", () => {
  it("adds the range and derives margin % from the totals", () => {
    const totals = summarizePeriods([
      period("2026-09", 1000, 600),
      period("2026-10", 1000, 400),
    ]);
    expect(totals).toEqual({
      revenue: 2000,
      cost: 1000,
      margin: 1000,
      marginPct: 50,
      tripCount: 2,
    });
  });

  it("handles an empty range", () => {
    expect(summarizePeriods([]).marginPct).toBeNull();
  });
});

describe("hasAnyPeriodActivity", () => {
  it("detects whether any month has trips or amounts", () => {
    expect(hasAnyPeriodActivity([period("2025-09", 0, 0)])).toBe(false);
    expect(hasAnyPeriodActivity([period("2025-09", 0, 0), period("2025-10", 0, 50)])).toBe(
      true,
    );
  });
});

describe("shiftPeriod", () => {
  it("moves across year boundaries", () => {
    expect(shiftPeriod("2026-01", -12)).toBe("2025-01");
    expect(shiftPeriod("2026-01", -1)).toBe("2025-12");
    expect(shiftPeriod("2025-12", 1)).toBe("2026-01");
  });
});

describe("alignPerformanceMonths", () => {
  const data: MonthlyPerformance = {
    periods: ["2026-09", "2026-10"],
    current: [period("2026-09", 1000, 600), period("2026-10", 500, 100)],
    previous: [period("2025-09", 800, 500)],
  };

  it("pairs each month with the same month of the previous year", () => {
    const months = alignPerformanceMonths(data);
    expect(months.map((month) => month.period)).toEqual(["2026-09", "2026-10"]);
    expect(months[0]?.previous.period).toBe("2025-09");
    expect(months[1]?.previous).toEqual(period("2025-10", 0, 0));
  });

  it("marks the last API period as in progress (not the browser clock)", () => {
    const months = alignPerformanceMonths(data);
    expect(getInProgressPeriod(data)).toBe("2026-10");
    expect(months.map((month) => month.isInProgress)).toEqual([false, true]);
  });

  it("returns no months for an empty response", () => {
    expect(alignPerformanceMonths({ periods: [], current: [], previous: [] })).toEqual(
      [],
    );
  });
});
