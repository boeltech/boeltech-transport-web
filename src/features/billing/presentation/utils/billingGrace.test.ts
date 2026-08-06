import { describe, expect, it } from "vitest";
import {
  filterClosedBillingPeriods,
  PAST_DUE_DAYS_UNTIL_PAUSE,
  resolvePastDueGraceDeadline,
  resolveTenantGraceDeadline,
} from "./billingGrace";

describe("resolvePastDueGraceDeadline", () => {
  it("returns null without a usable period start", () => {
    expect(resolvePastDueGraceDeadline(null)).toBeNull();
    expect(resolvePastDueGraceDeadline("no-es-fecha")).toBeNull();
  });

  it(`adds ${PAST_DUE_DAYS_UNTIL_PAUSE} days from period start`, () => {
    const deadline = resolvePastDueGraceDeadline("2026-08-01T06:00:00.000Z");
    expect(deadline?.toISOString()).toBe("2026-08-15T06:00:00.000Z");
  });
});

describe("resolveTenantGraceDeadline", () => {
  it("prefers oldest_due_date from API when parseable", () => {
    const deadline = resolveTenantGraceDeadline({
      oldestDueDate: "2026-08-20T05:59:59.999Z",
      currentPeriodStart: "2026-08-01T06:00:00.000Z",
    });
    expect(deadline?.toISOString()).toBe("2026-08-20T05:59:59.999Z");
  });

  it("falls back to period_start+14 when oldest_due_date missing or invalid", () => {
    expect(
      resolveTenantGraceDeadline({
        oldestDueDate: null,
        currentPeriodStart: "2026-08-01T06:00:00.000Z",
      })?.toISOString(),
    ).toBe("2026-08-15T06:00:00.000Z");

    expect(
      resolveTenantGraceDeadline({
        oldestDueDate: "no-es-fecha",
        currentPeriodStart: "2026-08-01T06:00:00.000Z",
      })?.toISOString(),
    ).toBe("2026-08-15T06:00:00.000Z");
  });

  it("returns null when both sources are unusable", () => {
    expect(
      resolveTenantGraceDeadline({
        oldestDueDate: null,
        currentPeriodStart: null,
      }),
    ).toBeNull();
  });
});

describe("filterClosedBillingPeriods", () => {
  const history = [
    { periodKey: "2026-08", stampsUsed: 2 },
    { periodKey: "2026-07", stampsUsed: 40 },
    { periodKey: "2026-06", stampsUsed: 10 },
  ];

  it("excludes the current period key", () => {
    expect(filterClosedBillingPeriods(history, "2026-08")).toEqual([
      { periodKey: "2026-07", stampsUsed: 40 },
      { periodKey: "2026-06", stampsUsed: 10 },
    ]);
  });

  it("returns history unchanged without a current key", () => {
    expect(filterClosedBillingPeriods(history, null)).toEqual(history);
  });
});
