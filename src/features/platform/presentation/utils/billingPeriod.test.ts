import { describe, expect, it } from "vitest";
import {
  getLastClosedMexicoCityPeriodKey,
  getMexicoCityPeriodKey,
  isClosedBillingPeriodKey,
  isPeriodKeyInLastMonths,
  isValidBillingPeriodKey,
  resolveClosedPeriodKeyForCloseRun,
  shiftBillingPeriodKey,
} from "./billingPeriod";

describe("billingPeriod (CDMX)", () => {
  it("getMexicoCityPeriodKey returns YYYY-MM for Mexico City", () => {
    expect(getMexicoCityPeriodKey(new Date("2026-07-15T18:00:00.000Z"))).toBe(
      "2026-07",
    );
  });

  it("getLastClosedMexicoCityPeriodKey returns prior month", () => {
    expect(
      getLastClosedMexicoCityPeriodKey(new Date("2026-08-03T15:00:00.000Z")),
    ).toBe("2026-07");
    expect(
      getLastClosedMexicoCityPeriodKey(new Date("2026-01-10T18:00:00.000Z")),
    ).toBe("2025-12");
  });

  it("isClosedBillingPeriodKey compares against current month", () => {
    const augustNow = new Date("2026-08-03T15:00:00.000Z");
    expect(isClosedBillingPeriodKey("2026-07", augustNow)).toBe(true);
    expect(isClosedBillingPeriodKey("2026-08", augustNow)).toBe(false);
  });

  it("isValidBillingPeriodKey validates format and month range", () => {
    expect(isValidBillingPeriodKey("2026-07")).toBe(true);
    expect(isValidBillingPeriodKey("2026-13")).toBe(false);
    expect(isValidBillingPeriodKey("2026-7")).toBe(false);
  });

  it("resolveClosedPeriodKeyForCloseRun uses filter if closed, else last closed", () => {
    const augustNow = new Date("2026-08-03T15:00:00.000Z");
    expect(resolveClosedPeriodKeyForCloseRun("2026-06", augustNow)).toBe(
      "2026-06",
    );
    expect(resolveClosedPeriodKeyForCloseRun("2026-08", augustNow)).toBe(
      "2026-07",
    );
    expect(resolveClosedPeriodKeyForCloseRun("", augustNow)).toBe("2026-07");
    expect(resolveClosedPeriodKeyForCloseRun("nope", augustNow)).toBe(
      "2026-07",
    );
  });

  it("shiftBillingPeriodKey walks calendar months", () => {
    expect(shiftBillingPeriodKey("2026-08", -11)).toBe("2025-09");
    expect(shiftBillingPeriodKey("2026-01", -1)).toBe("2025-12");
  });

  it("isPeriodKeyInLastMonths includes current CDMX month and 11 prior", () => {
    const augustNow = new Date("2026-08-10T18:00:00.000Z");
    expect(isPeriodKeyInLastMonths("2026-08", 12, augustNow)).toBe(true);
    expect(isPeriodKeyInLastMonths("2025-09", 12, augustNow)).toBe(true);
    expect(isPeriodKeyInLastMonths("2025-08", 12, augustNow)).toBe(false);
    expect(isPeriodKeyInLastMonths("2025-07", 12, augustNow)).toBe(false);
  });
});
