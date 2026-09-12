import { describe, expect, it } from "vitest";

import { StopStatus } from "@features/trips/domain";

import { isStopImmutableMidTrip } from "./isStopImmutableMidTrip";

describe("isStopImmutableMidTrip", () => {
  it("locks non-pending statuses", () => {
    expect(
      isStopImmutableMidTrip({
        status: StopStatus.COMPLETED,
        stopType: ["origin"],
      }),
    ).toBe(true);
    expect(
      isStopImmutableMidTrip({
        status: StopStatus.IN_PROGRESS,
        stopType: ["pickup"],
      }),
    ).toBe(true);
  });

  it("locks pending origin with actualDeparture", () => {
    expect(
      isStopImmutableMidTrip({
        status: StopStatus.PENDING,
        stopType: ["origin", "pickup"],
        actualDeparture: "2026-05-01T10:00:00.000Z",
      }),
    ).toBe(true);
  });

  it("allows pending destination and waypoints", () => {
    expect(
      isStopImmutableMidTrip({
        status: StopStatus.PENDING,
        stopType: ["destination", "delivery"],
        actualDeparture: null,
      }),
    ).toBe(false);
    expect(
      isStopImmutableMidTrip({
        status: "pending",
        stopType: "pickup",
      }),
    ).toBe(false);
  });
});
