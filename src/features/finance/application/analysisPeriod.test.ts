import { describe, expect, it } from "vitest";
import {
  analysisPeriodUrlRange,
  monthPeriodDateRange,
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
  it("defaults to the last 12 complete months when the URL has no period", () => {
    expect(resolveAnalysisPeriod({ from: "", to: "" }, TODAY)).toEqual({
      from: "2025-10-01",
      to: "2026-09-30",
      choice: "last_12",
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
    expect(analysisPeriodUrlRange("last_12", TODAY)).toEqual({ from: "", to: "" });
    expect(analysisPeriodUrlRange("last_3", TODAY)).toEqual({
      from: "2026-07-01",
      to: "2026-09-30",
    });
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
