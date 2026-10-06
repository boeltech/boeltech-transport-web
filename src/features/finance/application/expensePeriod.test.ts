import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentMonthExpenseRange } from "./expensePeriod";

describe("getCurrentMonthExpenseRange", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the calendar month of the given day including leap years", () => {
    expect(getCurrentMonthExpenseRange("2024-02-15")).toEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
    expect(getCurrentMonthExpenseRange("2026-12-31")).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
  });

  it("uses today in CDMX, not UTC, at the month boundary", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    // 2026-01-31 23:30 en CDMX: en UTC ya es febrero.
    vi.setSystemTime(new Date("2026-02-01T05:30:00Z"));

    expect(getCurrentMonthExpenseRange()).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });
});
