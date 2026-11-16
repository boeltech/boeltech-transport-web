import { describe, expect, it } from "vitest";

import {
  formatTripLateDelayChip,
  resolveTripLateDelayMs,
} from "./formatTripLateDelayChip";

describe("formatTripLateDelayChip (D33)", () => {
  it("≥1 h enteras → Nh de retraso", () => {
    expect(formatTripLateDelayChip(3_600_000)).toBe("1 h de retraso");
    expect(formatTripLateDelayChip(3 * 3_600_000 + 59_000)).toBe(
      "3 h de retraso",
    );
  });

  it("<1 h → <1 h de retraso (no «va tarde»)", () => {
    expect(formatTripLateDelayChip(0)).toBe("<1 h de retraso");
    expect(formatTripLateDelayChip(59 * 60_000)).toBe("<1 h de retraso");
    expect(formatTripLateDelayChip(3_599_999)).not.toMatch(/va tarde/i);
  });
});

describe("resolveTripLateDelayMs", () => {
  const now = Date.parse("2026-11-15T12:00:00.000Z");

  it("prioriza llegada vencida sobre salida", () => {
    const delay = resolveTripLateDelayMs({
      nowMs: now,
      scheduledDepartureMs: now - 5 * 3_600_000,
      scheduledArrivalMs: now - 2 * 3_600_000,
      hasActualDeparture: true,
      hasActualArrival: false,
    });
    expect(delay).toBe(2 * 3_600_000);
  });

  it("usa salida vencida si aún no hay llegada programada vencida", () => {
    const delay = resolveTripLateDelayMs({
      nowMs: now,
      scheduledDepartureMs: now - 90 * 60_000,
      scheduledArrivalMs: now + 3_600_000,
      hasActualDeparture: false,
      hasActualArrival: false,
    });
    expect(delay).toBe(90 * 60_000);
  });

  it("null si no hay atraso", () => {
    expect(
      resolveTripLateDelayMs({
        nowMs: now,
        scheduledDepartureMs: now + 3_600_000,
        scheduledArrivalMs: now + 5 * 3_600_000,
        hasActualDeparture: false,
        hasActualArrival: false,
      }),
    ).toBeNull();
  });
});
