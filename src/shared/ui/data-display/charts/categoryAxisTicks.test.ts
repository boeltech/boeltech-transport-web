import { describe, expect, it } from "vitest";
import {
  buildTrailingMonthPeriods,
  formatMonthPeriodAxis,
  formatMonthPeriodShort,
} from "@shared/utils/monthPeriod";
import { findPeakCategory, selectCategoryAxisTicks } from "./categoryAxisTicks";

const twelveMonths = buildTrailingMonthPeriods("2026-10", 12);
const shortLabels = twelveMonths.map((period, index) => formatMonthPeriodAxis(period, index));

/** Hueco mínimo en px entre etiquetas vecinas (12 px de fuente ≈ 7.2 px por carácter). */
function minGapBetweenTicks(ticks: string[], availableWidth: number): number {
  const slot = availableWidth / twelveMonths.length;
  const indices = ticks.map((tick) => twelveMonths.indexOf(tick));
  let gap = Infinity;
  for (let i = 1; i < indices.length; i += 1) {
    const a = indices[i - 1]!;
    const b = indices[i]!;
    const halfWidths = ((shortLabels[a]!.length + shortLabels[b]!.length) / 2) * 7.2;
    gap = Math.min(gap, (b - a) * slot - halfWidths);
  }
  return gap;
}

describe("selectCategoryAxisTicks", () => {
  it("shows every month at ~900px (chart width minus a 64px Y axis)", () => {
    expect(
      selectCategoryAxisTicks({
        values: twelveMonths,
        labels: shortLabels,
        availableWidth: 898 - 72,
        priorityValues: ["2026-09"],
      }),
    ).toEqual(twelveMonths);
  });

  it("skips ticks on mobile but always keeps the current month and the peak", () => {
    const ticks = selectCategoryAxisTicks({
      values: twelveMonths,
      labels: shortLabels,
      availableWidth: 300 - 72,
      priorityValues: ["2026-06"],
    });

    expect(ticks).toBeDefined();
    expect(ticks!.length).toBeLessThan(12);
    expect(ticks).toContain("2026-10");
    expect(ticks).toContain("2026-06");
    expect([...ticks!].sort()).toEqual(ticks);
  });

  it("drops anchored neighbours that would collide with the peak", () => {
    const ticks = selectCategoryAxisTicks({
      values: twelveMonths,
      labels: shortLabels,
      availableWidth: 300 - 72,
      priorityValues: ["2026-08"],
    })!;
    const indices = ticks.map((value) => twelveMonths.indexOf(value));
    const peak = twelveMonths.indexOf("2026-08");
    const stride = 4;

    expect(ticks).toContain("2026-08");
    expect(
      indices.filter((index) => index !== peak && index !== 11 && Math.abs(index - peak) < stride),
    ).toEqual([]);
  });

  it("keeps only the current month when the peak is right before it and they would touch (375px)", () => {
    const availableWidth = 300 - 72;
    const ticks = selectCategoryAxisTicks({
      values: twelveMonths,
      labels: shortLabels,
      availableWidth,
      priorityValues: ["2026-09"],
    })!;

    expect(ticks).toContain("2026-10");
    expect(ticks).not.toContain("2026-09");
    expect(minGapBetweenTicks(ticks, availableWidth)).toBeGreaterThanOrEqual(8);
  });

  it("keeps the adjacent peak when there is room for a readable gap", () => {
    const availableWidth = 420;
    const ticks = selectCategoryAxisTicks({
      values: twelveMonths,
      labels: shortLabels,
      availableWidth,
      priorityValues: ["2026-09"],
    })!;

    expect(ticks.length).toBeLessThan(12);
    expect(ticks).toEqual(expect.arrayContaining(["2026-09", "2026-10"]));
    expect(minGapBetweenTicks(ticks, availableWidth)).toBeGreaterThanOrEqual(8);
  });

  it("returns undefined when the width is unknown so Recharts decides", () => {
    expect(
      selectCategoryAxisTicks({ values: twelveMonths, labels: shortLabels, availableWidth: 0 }),
    ).toBeUndefined();
  });

  it("does not fit the old full labels with «(en curso)» at ~900px (N1)", () => {
    const oldLabels = [
      ...twelveMonths.slice(0, 11).map((period) => formatMonthPeriodShort(period)),
      "oct 2026 (en curso)",
    ];
    expect(
      selectCategoryAxisTicks({
        values: twelveMonths,
        labels: oldLabels,
        availableWidth: 898 - 72,
      }),
    ).not.toEqual(twelveMonths);
  });
});

describe("findPeakCategory", () => {
  it("returns the category with the highest value across keys", () => {
    const rows = [
      { period: "2026-08", revenue: 10, cost: 50 },
      { period: "2026-09", revenue: 700, cost: 40 },
      { period: "2026-10", revenue: 80, cost: 5 },
    ];
    expect(findPeakCategory(rows, "period", ["revenue", "cost"])).toBe("2026-09");
  });

  it("returns undefined when every value is zero", () => {
    expect(findPeakCategory([{ period: "2026-10", revenue: 0 }], "period", ["revenue"])).toBeUndefined();
  });
});
