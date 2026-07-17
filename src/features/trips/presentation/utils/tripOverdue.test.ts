import { describe, expect, it } from "vitest";
import { TripStatus } from "../../domain";
import {
  getTripOverdueState,
  tripOverdueSeverityFromHours,
  TRIP_OVERDUE_ERROR_THRESHOLD_HOURS,
} from "./tripOverdue";

describe("tripOverdueSeverityFromHours", () => {
  it("matches API threshold", () => {
    expect(TRIP_OVERDUE_ERROR_THRESHOLD_HOURS).toBe(24);
    expect(tripOverdueSeverityFromHours(24)).toBe("warning");
    expect(tripOverdueSeverityFromHours(25)).toBe("error");
  });
});

describe("getTripOverdueState", () => {
  const now = new Date("2026-07-06T12:00:00.000Z");

  it("returns not overdue for completed trips", () => {
    expect(
      getTripOverdueState({
        status: TripStatus.COMPLETED,
        scheduledArrival: new Date("2026-07-05T12:00:00.000Z"),
        now,
      }).isOverdue,
    ).toBe(false);
  });

  it("returns not overdue when scheduled_arrival is null", () => {
    expect(
      getTripOverdueState({
        status: TripStatus.IN_PROGRESS,
        scheduledArrival: null,
        now,
      }).isOverdue,
    ).toBe(false);
  });

  it("returns not overdue when arrival is in the future", () => {
    expect(
      getTripOverdueState({
        status: TripStatus.IN_PROGRESS,
        scheduledArrival: new Date("2026-07-07T12:00:00.000Z"),
        now,
      }).isOverdue,
    ).toBe(false);
  });

  it("returns warning severity within 24h", () => {
    const state = getTripOverdueState({
      status: TripStatus.IN_PROGRESS,
      scheduledArrival: new Date("2026-07-05T14:00:00.000Z"),
      now,
    });
    expect(state.isOverdue).toBe(true);
    if (state.isOverdue) {
      expect(state.hoursOverdue).toBe(22);
      expect(state.severity).toBe("warning");
    }
  });

  it("returns error severity beyond 24h", () => {
    const state = getTripOverdueState({
      status: TripStatus.IN_PROGRESS,
      scheduledArrival: new Date("2026-07-04T10:00:00.000Z"),
      now,
    });
    expect(state.isOverdue).toBe(true);
    if (state.isOverdue) {
      expect(state.hoursOverdue).toBeGreaterThan(24);
      expect(state.severity).toBe("error");
    }
  });
});
