import { describe, expect, it } from "vitest";

import { StopStatus } from "@features/trips/domain";

import {
  buildAtDockDispatchBatchEvents,
  originStopAlreadyArrived,
  suggestDefaultDispatchLocationIntent,
} from "./resolveDispatchLocationIntent";

describe("suggestDefaultDispatchLocationIntent", () => {
  it("sugiere at_dock cuando hay sucursal y origen sin cliente (señal barata)", () => {
    expect(
      suggestDefaultDispatchLocationIntent({
        originBranchId: "branch-1",
        originStop: { clientId: null },
      }),
    ).toBe("at_dock");
  });

  it("default documentado en_route sin señal fiable", () => {
    expect(
      suggestDefaultDispatchLocationIntent({
        originBranchId: null,
        originStop: { clientId: null },
      }),
    ).toBe("en_route");
    expect(
      suggestDefaultDispatchLocationIntent({
        originBranchId: "branch-1",
        originStop: { clientId: "client-1" },
      }),
    ).toBe("en_route");
  });
});

describe("originStopAlreadyArrived", () => {
  it("detecta llegada por actualArrival o status", () => {
    expect(
      originStopAlreadyArrived({
        actualArrival: new Date("2026-10-25T12:00:00Z"),
        status: StopStatus.PENDING,
      }),
    ).toBe(true);
    expect(
      originStopAlreadyArrived({
        actualArrival: null,
        status: StopStatus.IN_PROGRESS,
      }),
    ).toBe(true);
    expect(
      originStopAlreadyArrived({
        actualArrival: null,
        status: StopStatus.PENDING,
      }),
    ).toBe(false);
  });
});

describe("buildAtDockDispatchBatchEvents", () => {
  it("emite trip_dispatched + stop_arrived con keys distintas y sin trip_departed", () => {
    const events = buildAtDockDispatchBatchEvents({
      originStopId: "stop-origin",
      occurredAtIso: "2026-10-25T18:00:00.000Z",
      mileage: 120000,
      latitude: 25.6,
      longitude: -100.3,
      dispatchIdempotencyKey: "key-dispatch",
      arriveIdempotencyKey: "key-arrive",
    });

    expect(events).toHaveLength(2);
    expect(events[0]?.eventType).toBe("trip_dispatched");
    expect(events[0]?.mileage).toBe(120000);
    expect(events[0]?.idempotencyKey).toBe("key-dispatch");
    expect(events[1]?.eventType).toBe("stop_arrived");
    expect(events[1]?.stopId).toBe("stop-origin");
    expect(events[1]?.idempotencyKey).toBe("key-arrive");
    expect(events[0]?.occurredAt).toBe(events[1]?.occurredAt);
    expect(events.every((e) => e.eventType !== "trip_departed")).toBe(true);
    expect(events.every((e) => e.capturedVia === "web")).toBe(true);
  });
});
