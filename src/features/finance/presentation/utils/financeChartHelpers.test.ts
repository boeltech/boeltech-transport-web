import { describe, expect, it } from "vitest";
import { formatDate } from "@shared/utils/dateUtils";
import {
  filterNonZeroChartSlices,
  formatFinanceChartPeriodLabel,
  formatFinancePeriodLabel,
} from "./financeChartHelpers";

describe("formatFinancePeriodLabel", () => {
  it("shows the short month with the full year", () => {
    expect(formatFinancePeriodLabel("2026-09-01")).toBe("sep 2026");
    expect(formatFinancePeriodLabel("2026-01")).toBe("ene 2026");
  });

  it("returns the raw value when it is not a period", () => {
    expect(formatFinancePeriodLabel("bad")).toBe("bad");
  });
});

describe("formatFinanceChartPeriodLabel", () => {
  it("month: abreviado con año", () => {
    expect(formatFinanceChartPeriodLabel("2026-10-01", "month")).toBe(
      "oct 2026",
    );
  });

  it("day: fecha civil (no colapsa a mes)", () => {
    expect(formatFinanceChartPeriodLabel("2026-10-06", "day")).toBe(
      formatDate("2026-10-06"),
    );
    expect(formatFinanceChartPeriodLabel("2026-10-07", "day")).not.toBe(
      formatFinanceChartPeriodLabel("2026-10-06", "day"),
    );
  });

  it("week: rango lunes–domingo (inicio ISO del API)", () => {
    expect(formatFinanceChartPeriodLabel("2026-10-05", "week")).toBe(
      "5–11 oct",
    );
    expect(formatFinanceChartPeriodLabel("2026-09-28", "week")).toBe(
      "28 sep – 4 oct 2026",
    );
  });
});

describe("filterNonZeroChartSlices", () => {
  it("keeps only slices with value greater than zero", () => {
    const data = [
      { label: "Borrador", value: 0 },
      { label: "Timbrada", value: 7 },
    ];
    const series = [
      { dataKey: "value", label: "Borrador", token: "neutral" as const },
      { dataKey: "value", label: "Timbrada", token: "chart-1" as const },
    ];

    const result = filterNonZeroChartSlices(data, series);

    expect(result.data).toEqual([{ label: "Timbrada", value: 7 }]);
    expect(result.series).toEqual([
      { dataKey: "value", label: "Timbrada", token: "chart-1" },
    ]);
  });
});