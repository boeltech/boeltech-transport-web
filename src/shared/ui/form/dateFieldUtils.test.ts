import { describe, expect, it } from "vitest";

import { getTodayString } from "@shared/utils/dateUtils";

import {
  addCalendarDays,
  formatIsoMonth,
  isIsoMonthInRange,
  joinDateTimeLocal,
  mexicoTodayAt,
  parseIsoMonthParts,
  splitDateTimeLocal,
} from "./dateFieldUtils";

describe("splitDateTimeLocal / joinDateTimeLocal", () => {
  it("splits datetime-local including seconds suffix", () => {
    expect(splitDateTimeLocal("2026-03-10T08:00:00")).toEqual({
      date: "2026-03-10",
      time: "08:00",
    });
  });

  it("joins only when both parts exist", () => {
    expect(joinDateTimeLocal("2026-03-10", "08:00")).toBe("2026-03-10T08:00");
    expect(joinDateTimeLocal("2026-03-10", "")).toBe("");
  });
});

describe("addCalendarDays", () => {
  it("crosses month boundaries in civil dates", () => {
    expect(addCalendarDays("2026-03-31", 1)).toBe("2026-04-01");
  });
});

describe("mexicoTodayAt", () => {
  it("uses getTodayString as the civil day", () => {
    expect(mexicoTodayAt("08:00")).toBe(`${getTodayString()}T08:00`);
  });
});

describe("iso month helpers", () => {
  it("parses and formats AAAA-MM keys", () => {
    expect(parseIsoMonthParts("2026-07")).toEqual({ year: 2026, month: 7 });
    expect(parseIsoMonthParts("2026-7")).toBeNull();
    expect(formatIsoMonth(2026, 7)).toBe("2026-07");
  });

  it("compares month keys as civil ranges", () => {
    expect(isIsoMonthInRange("2026-07", "2026-06", "2026-08")).toBe(true);
    expect(isIsoMonthInRange("2026-05", "2026-06")).toBe(false);
    expect(isIsoMonthInRange("2026-09", undefined, "2026-08")).toBe(false);
  });
});
