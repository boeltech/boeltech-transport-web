import { describe, expect, it } from "vitest";
import {
  filterNonZeroChartSlices,
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