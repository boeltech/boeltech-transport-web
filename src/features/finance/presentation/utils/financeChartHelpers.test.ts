import { describe, expect, it } from "vitest";
import {
  filterNonZeroChartSlices,
  formatExpenseTemporalLabel,
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

describe("formatExpenseTemporalLabel", () => {
  it("uses month label when from/to share the same month", () => {
    expect(
      formatExpenseTemporalLabel({
        from: "2026-03-01",
        to: "2026-03-31",
      }),
    ).toMatch(/marzo.*2026/i);
  });

  it("falls back to latest series period when no date range", () => {
    expect(
      formatExpenseTemporalLabel({ latestPeriod: "2026-02-01" }),
    ).toMatch(/febrero.*2026/i);
  });

  it("returns em dash when nothing is available", () => {
    expect(formatExpenseTemporalLabel({})).toBe("—");
  });
});
