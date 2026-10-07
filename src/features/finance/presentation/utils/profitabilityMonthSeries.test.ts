import { describe, expect, it } from "vitest";
import type { ProfitabilityAggregateItem } from "@features/finance/domain";
import {
  buildProfitabilityMonthlyChartRows,
  sortProfitabilityMonthsChronologically,
} from "./profitabilityMonthSeries";

function monthRow(
  key: string,
  totalRevenue: number,
  blendedMarginPct: number | null = 10,
): ProfitabilityAggregateItem {
  return {
    key,
    label: key,
    tripCount: 1,
    totalRevenue,
    totalActual: totalRevenue / 2,
    blendedMargin: totalRevenue / 2,
    blendedMarginPct,
  };
}

/** Orden del API con `sortBy: totalRevenue asc`: por ingreso, no por fecha. */
const revenueOrdered = [
  monthRow("2026-01", 100),
  monthRow("2026-03", 200),
  monthRow("2025-12", 300),
  monthRow("2026-02", 400),
];

describe("sortProfitabilityMonthsChronologically", () => {
  it("orders by YYYY-MM key regardless of the API order, across years", () => {
    expect(
      sortProfitabilityMonthsChronologically(revenueOrdered).map((row) => row.key),
    ).toEqual(["2025-12", "2026-01", "2026-02", "2026-03"]);
  });

  it("does not mutate the cached API array", () => {
    const input = [...revenueOrdered];
    sortProfitabilityMonthsChronologically(input);
    expect(input.map((row) => row.key)).toEqual([
      "2026-01",
      "2026-03",
      "2025-12",
      "2026-02",
    ]);
  });

  it("returns an empty list when there is no data", () => {
    expect(sortProfitabilityMonthsChronologically(undefined)).toEqual([]);
  });
});

describe("buildProfitabilityMonthlyChartRows", () => {
  it("builds chronological rows labelled with the short month", () => {
    expect(buildProfitabilityMonthlyChartRows(revenueOrdered)).toEqual([
      { label: "dic 2025", revenue: 300, actual: 150, marginPct: 10 },
      { label: "ene 2026", revenue: 100, actual: 50, marginPct: 10 },
      { label: "feb 2026", revenue: 400, actual: 200, marginPct: 10 },
      { label: "mar 2026", revenue: 200, actual: 100, marginPct: 10 },
    ]);
  });

  it("plots a missing margin % as zero", () => {
    expect(
      buildProfitabilityMonthlyChartRows([monthRow("2026-04", 500, null)])[0]
        ?.marginPct,
    ).toBe(0);
  });
});
