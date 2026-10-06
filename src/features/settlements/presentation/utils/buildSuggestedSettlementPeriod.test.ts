import { afterEach, describe, it, expect, vi } from "vitest";
import {
  getWeekPeriod,
  getBiweeklyPeriod,
  getMonthlyPeriod,
  getNextPeriod,
  getPreviousPeriod,
  buildSuggestedSettlementPeriod,
  isoWeekNumber,
} from "./buildSuggestedSettlementPeriod";

// ---------------------------------------------------------------------------
// getWeekPeriod
// ---------------------------------------------------------------------------

describe("getWeekPeriod", () => {
  it("returns Mon–Sun for a Wednesday", () => {
    // 2026-09-09 is a Wednesday
    expect(getWeekPeriod("2026-09-09")).toEqual({
      periodStart: "2026-09-07",
      periodEnd: "2026-09-13",
    });
  });

  it("returns the same week when given Monday", () => {
    expect(getWeekPeriod("2026-09-07")).toEqual({
      periodStart: "2026-09-07",
      periodEnd: "2026-09-13",
    });
  });

  it("returns the same week when given Sunday", () => {
    expect(getWeekPeriod("2026-09-13")).toEqual({
      periodStart: "2026-09-07",
      periodEnd: "2026-09-13",
    });
  });

  it("handles year boundary (Dec 29 2025 is a Mon → week spans into Jan 2026)", () => {
    expect(getWeekPeriod("2025-12-31")).toEqual({
      periodStart: "2025-12-29",
      periodEnd: "2026-01-04",
    });
  });
});

// ---------------------------------------------------------------------------
// getBiweeklyPeriod
// ---------------------------------------------------------------------------

describe("getBiweeklyPeriod", () => {
  it("1st half — day 1 to 15", () => {
    expect(getBiweeklyPeriod("2026-09-10")).toEqual({
      periodStart: "2026-09-01",
      periodEnd: "2026-09-15",
    });
  });

  it("2nd half — day 16 to end of month", () => {
    expect(getBiweeklyPeriod("2026-09-20")).toEqual({
      periodStart: "2026-09-16",
      periodEnd: "2026-09-30",
    });
  });

  it("2nd half for Feb (28 days in non-leap year)", () => {
    expect(getBiweeklyPeriod("2026-02-18")).toEqual({
      periodStart: "2026-02-16",
      periodEnd: "2026-02-28",
    });
  });

  it("2nd half for Feb (29 days in leap year)", () => {
    expect(getBiweeklyPeriod("2028-02-20")).toEqual({
      periodStart: "2028-02-16",
      periodEnd: "2028-02-29",
    });
  });

  it("boundary day 15 belongs to 1st half", () => {
    expect(getBiweeklyPeriod("2026-09-15")).toEqual({
      periodStart: "2026-09-01",
      periodEnd: "2026-09-15",
    });
  });

  it("boundary day 16 belongs to 2nd half", () => {
    expect(getBiweeklyPeriod("2026-09-16")).toEqual({
      periodStart: "2026-09-16",
      periodEnd: "2026-09-30",
    });
  });
});

// ---------------------------------------------------------------------------
// getMonthlyPeriod
// ---------------------------------------------------------------------------

describe("getMonthlyPeriod", () => {
  it("returns full month for September", () => {
    expect(getMonthlyPeriod("2026-09-15")).toEqual({
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
    });
  });

  it("returns full month for January", () => {
    expect(getMonthlyPeriod("2026-01-01")).toEqual({
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
    });
  });
});

// ---------------------------------------------------------------------------
// getNextPeriod / getPreviousPeriod — weekly
// ---------------------------------------------------------------------------

describe("getNextPeriod — weekly", () => {
  it("navigates from Sep 7 to Sep 14", () => {
    expect(getNextPeriod("weekly", "2026-09-07")).toEqual({
      periodStart: "2026-09-14",
      periodEnd: "2026-09-20",
    });
  });
});

describe("getPreviousPeriod — weekly", () => {
  it("navigates from Sep 14 back to Sep 7", () => {
    expect(getPreviousPeriod("weekly", "2026-09-14")).toEqual({
      periodStart: "2026-09-07",
      periodEnd: "2026-09-13",
    });
  });
});

// ---------------------------------------------------------------------------
// getNextPeriod / getPreviousPeriod — biweekly
// ---------------------------------------------------------------------------

describe("getNextPeriod — biweekly", () => {
  it("from 1st half to 2nd half of same month", () => {
    expect(getNextPeriod("biweekly", "2026-09-01")).toEqual({
      periodStart: "2026-09-16",
      periodEnd: "2026-09-30",
    });
  });

  it("from 2nd half to 1st half of next month", () => {
    expect(getNextPeriod("biweekly", "2026-09-16")).toEqual({
      periodStart: "2026-10-01",
      periodEnd: "2026-10-15",
    });
  });

  it("from 2nd half of Dec to 1st half of Jan next year", () => {
    expect(getNextPeriod("biweekly", "2026-12-16")).toEqual({
      periodStart: "2027-01-01",
      periodEnd: "2027-01-15",
    });
  });
});

describe("getPreviousPeriod — biweekly", () => {
  it("from 2nd half back to 1st half", () => {
    expect(getPreviousPeriod("biweekly", "2026-09-16")).toEqual({
      periodStart: "2026-09-01",
      periodEnd: "2026-09-15",
    });
  });

  it("from 1st half back to 2nd half of previous month", () => {
    expect(getPreviousPeriod("biweekly", "2026-09-01")).toEqual({
      periodStart: "2026-08-16",
      periodEnd: "2026-08-31",
    });
  });

  it("from 1st half of Jan back to 2nd half of Dec prev year", () => {
    expect(getPreviousPeriod("biweekly", "2027-01-01")).toEqual({
      periodStart: "2026-12-16",
      periodEnd: "2026-12-31",
    });
  });
});

// ---------------------------------------------------------------------------
// getNextPeriod / getPreviousPeriod — monthly
// ---------------------------------------------------------------------------

describe("getNextPeriod — monthly", () => {
  it("from Sep to Oct", () => {
    expect(getNextPeriod("monthly", "2026-09-01")).toEqual({
      periodStart: "2026-10-01",
      periodEnd: "2026-10-31",
    });
  });

  it("from Dec to Jan next year", () => {
    expect(getNextPeriod("monthly", "2026-12-01")).toEqual({
      periodStart: "2027-01-01",
      periodEnd: "2027-01-31",
    });
  });
});

describe("getPreviousPeriod — monthly", () => {
  it("from Sep to Aug", () => {
    expect(getPreviousPeriod("monthly", "2026-09-01")).toEqual({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    });
  });

  it("from Jan to Dec prev year", () => {
    expect(getPreviousPeriod("monthly", "2027-01-01")).toEqual({
      periodStart: "2026-12-01",
      periodEnd: "2026-12-31",
    });
  });
});

// ---------------------------------------------------------------------------
// buildSuggestedSettlementPeriod
// ---------------------------------------------------------------------------

describe("buildSuggestedSettlementPeriod", () => {
  it("weekly — uses asOfDate when no trip dates", () => {
    expect(
      buildSuggestedSettlementPeriod({
        salaryPeriod: "weekly",
        asOfDate: "2026-09-09",
      }),
    ).toEqual({ periodStart: "2026-09-07", periodEnd: "2026-09-13" });
  });

  it("biweekly — anchors to oldestTripDate", () => {
    expect(
      buildSuggestedSettlementPeriod({
        salaryPeriod: "biweekly",
        oldestTripDate: "2026-09-03",
        latestTripDate: "2026-09-12",
        asOfDate: "2026-09-15",
      }),
    ).toEqual({ periodStart: "2026-09-01", periodEnd: "2026-09-15" });
  });

  it("monthly — falls back to asOfDate", () => {
    expect(
      buildSuggestedSettlementPeriod({
        salaryPeriod: "monthly",
        asOfDate: "2026-09-20",
      }),
    ).toEqual({ periodStart: "2026-09-01", periodEnd: "2026-09-30" });
  });

  describe("default asOfDate (today in CDMX)", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("keeps January at 23:30 CDMX of Jan 31 (already Feb 1 in UTC)", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-02-01T05:30:00Z"));

      expect(buildSuggestedSettlementPeriod({ salaryPeriod: "monthly" })).toEqual({
        periodStart: "2026-01-01",
        periodEnd: "2026-01-31",
      });
      expect(buildSuggestedSettlementPeriod({ salaryPeriod: "biweekly" })).toEqual({
        periodStart: "2026-01-16",
        periodEnd: "2026-01-31",
      });
    });

    it("keeps the first fortnight at 21:00 CDMX of the 15th (already the 16th in UTC)", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-09-16T03:00:00Z"));

      expect(buildSuggestedSettlementPeriod({ salaryPeriod: "biweekly" })).toEqual({
        periodStart: "2026-09-01",
        periodEnd: "2026-09-15",
      });
    });
  });
});

// ---------------------------------------------------------------------------
// isoWeekNumber
// ---------------------------------------------------------------------------

describe("isoWeekNumber", () => {
  it("returns 37 for Sep 7–13 2026", () => {
    expect(isoWeekNumber("2026-09-07")).toBe(37);
  });

  it("returns 2 for Jan 5 2026 (Mon of ISO week 2)", () => {
    // Jan 1 2026 is Thu → ISO week 1 = Dec 29 Mon – Jan 4 Sun
    expect(isoWeekNumber("2026-01-05")).toBe(2);
  });
});
