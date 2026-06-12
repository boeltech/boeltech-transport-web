import { describe, expect, it } from "vitest";
import { filterNonZeroChartSlices } from "./financeChartHelpers";

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
