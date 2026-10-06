import { describe, expect, it } from "vitest";
import {
  buildTrailingMonthPeriods,
  formatMonthPeriodAxis,
  formatMonthPeriodShort,
  parseMonthPeriod,
  shiftMonthPeriod,
} from "./monthPeriod";

describe("parseMonthPeriod", () => {
  it("accepts YYYY-MM and YYYY-MM-DD", () => {
    expect(parseMonthPeriod("2026-09")).toEqual({ year: 2026, month: 9 });
    expect(parseMonthPeriod("2026-09-01")).toEqual({ year: 2026, month: 9 });
  });

  it("rejects malformed periods", () => {
    expect(parseMonthPeriod("bad")).toBeNull();
    expect(parseMonthPeriod("2026-13")).toBeNull();
  });
});

describe("formatMonthPeriodShort", () => {
  it("uses fixed Spanish abbreviations with the full year", () => {
    expect(formatMonthPeriodShort("2026-09")).toBe("sep 2026");
    expect(formatMonthPeriodShort("2026-01-01")).toBe("ene 2026");
    expect(formatMonthPeriodShort("bad")).toBe("bad");
  });
});

describe("formatMonthPeriodAxis", () => {
  it("shows the year on the first visible tick and in January only", () => {
    expect(formatMonthPeriodAxis("2025-11", 0)).toBe("nov 2025");
    expect(formatMonthPeriodAxis("2025-12", 1)).toBe("dic");
    expect(formatMonthPeriodAxis("2026-01", 2)).toBe("ene 2026");
    expect(formatMonthPeriodAxis("2026-09", 10)).toBe("sep");
    expect(formatMonthPeriodAxis("2026-10", 11)).toBe("oct");
    expect(formatMonthPeriodAxis("bad", 3)).toBe("bad");
  });
});

describe("shiftMonthPeriod", () => {
  it("crosses year boundaries both ways", () => {
    expect(shiftMonthPeriod("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthPeriod("2025-12", 1)).toBe("2026-01");
    expect(shiftMonthPeriod("2026-10", -12)).toBe("2025-10");
  });
});

describe("buildTrailingMonthPeriods", () => {
  it("returns N ascending months ending at the given period", () => {
    expect(buildTrailingMonthPeriods("2026-02", 4)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
    expect(buildTrailingMonthPeriods("2026-10", 12)).toHaveLength(12);
  });

  it("returns an empty list for non-positive windows", () => {
    expect(buildTrailingMonthPeriods("2026-10", 0)).toEqual([]);
  });
});
