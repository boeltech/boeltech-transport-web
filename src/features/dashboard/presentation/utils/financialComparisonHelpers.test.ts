import { afterEach, describe, expect, it, vi } from "vitest";
import type { FinancialTrendData } from "../../domain/types";
import {
  buildFinancialTrendChartData,
  describePlanVariance,
  formatPeriodLabel,
  getTrendCurrentPeriod,
} from "./financialComparisonHelpers";

const inProgress = (label: string) => `${label} (en curso)`;

function trend(overrides: Partial<FinancialTrendData> = {}): FinancialTrendData {
  return {
    periods: ["2026-07", "2026-10"],
    budgeted_revenue: [1, 2],
    actual_revenue: [100, 200],
    budgeted_cost: [3, 4],
    actual_cost: [50],
    ...overrides,
  };
}

describe("getTrendCurrentPeriod", () => {
  /** 2026-01-31 23:30 en CDMX: en UTC ya es febrero. */
  const LAST_DAY_OF_JANUARY_CDMX = "2026-02-01T05:30:00Z";

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prefers current_period from the API", () => {
    expect(
      getTrendCurrentPeriod(
        trend({ periods: ["2025-12", "2026-01"], currentPeriod: "2026-01" }),
        "2026-03-10",
      ),
    ).toBe("2026-01");
  });

  it("falls back to the last period of the dense series", () => {
    expect(getTrendCurrentPeriod(trend(), "2026-12-01")).toBe("2026-10");
  });

  it("anchors on the API month, not the browser clock, at the month boundary", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(LAST_DAY_OF_JANUARY_CDMX));

    expect(
      getTrendCurrentPeriod(
        trend({ periods: ["2025-12", "2026-01"], actual_revenue: [1, 2], actual_cost: [1, 2] }),
      ),
    ).toBe("2026-01");
  });

  it("uses today's month in CDMX when the API sends no periods", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(LAST_DAY_OF_JANUARY_CDMX));

    const empty = trend({
      periods: [],
      budgeted_revenue: [],
      actual_revenue: [],
      budgeted_cost: [],
      actual_cost: [],
    });
    expect(getTrendCurrentPeriod(empty)).toBe("2026-01");
    expect(getTrendCurrentPeriod(undefined)).toBe("2026-01");
  });

  it("marks January in progress when the API series ends in January", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(LAST_DAY_OF_JANUARY_CDMX));

    const january = trend({
      periods: ["2025-12", "2026-01"],
      actual_revenue: [10, 20],
      actual_cost: [5, 8],
      currentPeriod: "2026-01",
    });
    const rows = buildFinancialTrendChartData(january, {
      months: 6,
      currentPeriod: getTrendCurrentPeriod(january),
      formatCurrentLabel: inProgress,
    });

    expect(rows.map((row) => row.period)).toEqual([
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
    expect(rows.at(-1)).toEqual({
      period: "2026-01",
      label: "ene 2026 (en curso)",
      actualRevenue: 20,
      actualCost: 8,
    });
  });
});

describe("formatPeriodLabel", () => {
  it("uses the short month and the full year", () => {
    expect(formatPeriodLabel("2026-09")).toBe("sep 2026");
  });
});

describe("buildFinancialTrendChartData", () => {
  it("fills the whole window ending at the current month with zeros", () => {
    const rows = buildFinancialTrendChartData(trend(), {
      months: 6,
      currentPeriod: "2026-10",
      formatCurrentLabel: inProgress,
    });

    expect(rows).toEqual([
      { period: "2026-05", label: "may 2026", actualRevenue: 0, actualCost: 0 },
      { period: "2026-06", label: "jun 2026", actualRevenue: 0, actualCost: 0 },
      { period: "2026-07", label: "jul 2026", actualRevenue: 100, actualCost: 50 },
      { period: "2026-08", label: "ago 2026", actualRevenue: 0, actualCost: 0 },
      { period: "2026-09", label: "sep 2026", actualRevenue: 0, actualCost: 0 },
      {
        period: "2026-10",
        label: "oct 2026 (en curso)",
        actualRevenue: 200,
        actualCost: 0,
      },
    ]);
  });

  it("makes 6 and 12 months distinguishable even with sparse data", () => {
    const options = { currentPeriod: "2026-10", formatCurrentLabel: inProgress };
    expect(buildFinancialTrendChartData(trend(), { ...options, months: 6 })).toHaveLength(6);
    expect(buildFinancialTrendChartData(trend(), { ...options, months: 12 })).toHaveLength(12);
  });

  it("marks the current month in progress even when the API has no data for it", () => {
    const rows = buildFinancialTrendChartData(
      trend({ periods: ["2026-09"], actual_revenue: [10], actual_cost: [5] }),
      { months: 2, currentPeriod: "2026-10", formatCurrentLabel: inProgress },
    );

    expect(rows.at(-1)).toEqual({
      period: "2026-10",
      label: "oct 2026 (en curso)",
      actualRevenue: 0,
      actualCost: 0,
    });
  });

  it("ignores periods outside the window", () => {
    const rows = buildFinancialTrendChartData(
      trend({ periods: ["2026-04", "2026-11"], actual_revenue: [7, 9], actual_cost: [1, 2] }),
      { months: 6, currentPeriod: "2026-10", formatCurrentLabel: inProgress },
    );

    expect(rows.every((row) => row.actualRevenue === 0)).toBe(true);
  });

  it("returns an empty list without trend", () => {
    expect(
      buildFinancialTrendChartData(undefined, {
        months: 12,
        currentPeriod: "2026-10",
        formatCurrentLabel: inProgress,
      }),
    ).toEqual([]);
  });
});

describe("describePlanVariance", () => {
  it("reports no plan when nothing was planned", () => {
    expect(describePlanVariance(0, 55_000)).toEqual({ kind: "no_plan" });
    expect(describePlanVariance(0, 0)).toEqual({ kind: "no_plan" });
  });

  it("reports equal when the variance rounds to zero pesos", () => {
    expect(describePlanVariance(78_500, 0)).toEqual({ kind: "equal" });
    expect(describePlanVariance(78_500, 0.4)).toEqual({ kind: "equal" });
    expect(describePlanVariance(78_500, -0.5)).toEqual({ kind: "equal" });
  });

  it("formats the signed variance otherwise", () => {
    const up = describePlanVariance(60_000, 5_000);
    const down = describePlanVariance(60_000, -5_000);
    expect(up.kind === "variance" && up.value).toMatch(/^\+\$5,000$/);
    expect(down.kind === "variance" && down.value).toMatch(/5,000/);
    expect(describePlanVariance(60_000, 0.6)).toEqual({ kind: "variance", value: "+$1" });
  });
});
