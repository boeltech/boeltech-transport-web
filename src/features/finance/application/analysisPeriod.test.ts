import { describe, expect, it } from "vitest";
import {
  DEFAULT_ANALYSIS_PERIOD_PRESET,
  WIDEST_ANALYSIS_PERIOD_PRESET,
  analysisPeriodDayCount,
  analysisPeriodIncludesCurrentMonth,
  analysisPeriodUrlRange,
  monthPeriodDateRange,
  previousMonthDateRange,
  resolveAnalysisPeriod,
  resolveAnalysisPeriodPreset,
} from "./analysisPeriod";

const TODAY = "2026-10-06";

describe("resolveAnalysisPeriodPreset", () => {
  it("«12 meses» = 12 complete months: day 1 twelve months ago to the end of last month", () => {
    expect(resolveAnalysisPeriodPreset("last_12", TODAY)).toEqual({
      from: "2025-10-01",
      to: "2026-09-30",
    });
  });

  it("3 and 6 months are also complete months and exclude the month in progress", () => {
    expect(resolveAnalysisPeriodPreset("last_3", TODAY)).toEqual({
      from: "2026-07-01",
      to: "2026-09-30",
    });
    expect(resolveAnalysisPeriodPreset("last_6", TODAY)).toEqual({
      from: "2026-04-01",
      to: "2026-09-30",
    });
  });

  it("«Este mes» is the only option with the month in progress", () => {
    expect(resolveAnalysisPeriodPreset("this_month", TODAY)).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("crosses year and leap-year boundaries", () => {
    expect(resolveAnalysisPeriodPreset("last_12", "2026-01-15")).toEqual({
      from: "2025-01-01",
      to: "2025-12-31",
    });
    expect(resolveAnalysisPeriodPreset("last_3", "2028-03-01")).toEqual({
      from: "2027-12-01",
      to: "2028-02-29",
    });
  });
});

describe("resolveAnalysisPeriod", () => {
  it("defaults to «Este mes» when the URL has no period", () => {
    expect(DEFAULT_ANALYSIS_PERIOD_PRESET).toBe("this_month");
    expect(resolveAnalysisPeriod({ from: "", to: "" }, TODAY)).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
      choice: "this_month",
    });
  });

  it("recognizes a preset range written in the URL", () => {
    expect(
      resolveAnalysisPeriod({ from: "2026-10-01", to: "2026-10-31" }, TODAY).choice,
    ).toBe("this_month");
  });

  it("treats any other range as custom", () => {
    expect(
      resolveAnalysisPeriod({ from: "2026-09-01", to: "2026-09-30" }, TODAY),
    ).toEqual({ from: "2026-09-01", to: "2026-09-30", choice: "custom" });
  });
});

describe("analysisPeriodUrlRange", () => {
  it("omits the default period from the URL and writes the others", () => {
    expect(analysisPeriodUrlRange("this_month", TODAY)).toEqual({ from: "", to: "" });
    expect(analysisPeriodUrlRange("last_3", TODAY)).toEqual({
      from: "2026-07-01",
      to: "2026-09-30",
    });
  });

  it("writes «Últimos 12 meses» explicitly (Ampliar a 12 meses)", () => {
    expect(analysisPeriodUrlRange(WIDEST_ANALYSIS_PERIOD_PRESET, TODAY)).toEqual({
      from: "2025-10-01",
      to: "2026-09-30",
    });
  });
});

describe("previousMonthDateRange", () => {
  it("returns the whole previous month, across years", () => {
    expect(previousMonthDateRange(TODAY)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(previousMonthDateRange("2026-01-15")).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });
});

describe("analysisPeriodIncludesCurrentMonth", () => {
  it("is true only when the range touches the month in progress", () => {
    expect(analysisPeriodIncludesCurrentMonth({ from: "2026-10-01", to: "2026-10-31" }, TODAY)).toBe(true);
    expect(analysisPeriodIncludesCurrentMonth({ from: "2025-10-01", to: "2026-09-30" }, TODAY)).toBe(false);
    expect(analysisPeriodIncludesCurrentMonth({ from: "2026-09-20", to: "2026-10-02" }, TODAY)).toBe(true);
    expect(analysisPeriodIncludesCurrentMonth({ from: "2026-11-01", to: "2026-11-30" }, TODAY)).toBe(false);
  });
});

describe("analysisPeriodDayCount", () => {
  it("counts inclusive days, null when open-ended", () => {
    expect(analysisPeriodDayCount({ from: "2026-10-01", to: "2026-10-31" })).toBe(31);
    expect(analysisPeriodDayCount({ from: "2026-07-01", to: "2026-09-30" })).toBe(92);
    expect(analysisPeriodDayCount({ from: "2026-10-01" })).toBeNull();
  });
});

describe("monthPeriodDateRange", () => {
  it("returns the whole business month", () => {
    expect(monthPeriodDateRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });
});
