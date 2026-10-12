import { describe, expect, it } from "vitest";

import { StopStatus, StopType, type TripStop } from "@features/trips/domain";
import { formatTime } from "@shared/utils/dateUtils";

import { trackingCopy } from "../../copy";
import {
  buildStopPlanRealLines,
  isStopWaitingPhase,
} from "./trackingItineraryRail";

const STOP_DEFAULTS = {
  id: "stop-1",
  tenantId: "tenant-1",
  tripId: "trip-1",
  sequenceOrder: 1,
  stopType: [StopType.ORIGIN],
  addressId: null,
  clientId: null,
  clientAddressId: null,
  address: "",
  city: "",
  state: null,
  postalCode: null,
  latitude: null,
  longitude: null,
  locationName: null,
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: StopStatus.PENDING,
  notes: null,
  idUbicacion: null,
  rfcRemitenteDestinatario: null,
  distanceFromPreviousKm: null,
  distanceSource: null,
} as const;

function stop(
  overrides: Partial<TripStop> &
    Pick<TripStop, "id" | "sequenceOrder" | "stopType">,
): TripStop {
  return { ...STOP_DEFAULTS, ...overrides } as TripStop;
}

describe("isStopWaitingPhase", () => {
  it("is true for waypoint at_stop (arrival without departure)", () => {
    const waypoint = stop({
      id: "s2",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT],
      status: StopStatus.IN_PROGRESS,
      actualArrival: new Date("2026-07-12T12:00:00.000Z"),
      actualDeparture: null,
    });
    expect(isStopWaitingPhase(waypoint, "waypoint")).toBe(true);
  });

  it("is true for destination with arrival (at_stop)", () => {
    const dest = stop({
      id: "s3",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION],
      status: StopStatus.IN_PROGRESS,
      actualArrival: new Date("2026-07-12T18:00:00.000Z"),
    });
    expect(isStopWaitingPhase(dest, "destination")).toBe(true);
  });

  it("is false when departed", () => {
    const waypoint = stop({
      id: "s2",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT],
      status: StopStatus.COMPLETED,
      actualArrival: new Date("2026-07-12T12:00:00.000Z"),
      actualDeparture: new Date("2026-07-12T13:00:00.000Z"),
    });
    expect(isStopWaitingPhase(waypoint, "waypoint")).toBe(false);
  });

  it("is false for skipped / completed without treating as waiting", () => {
    const skipped = stop({
      id: "s2",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT],
      status: StopStatus.SKIPPED,
      actualArrival: new Date("2026-07-12T12:00:00.000Z"),
    });
    expect(isStopWaitingPhase(skipped, "waypoint")).toBe(false);
  });

  it("is false for pending without arrival", () => {
    const pending = stop({
      id: "s2",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT],
      status: StopStatus.PENDING,
    });
    expect(isStopWaitingPhase(pending, "waypoint")).toBe(false);
  });
});

describe("buildStopPlanRealLines", () => {
  it("origin shows only departure plan/real", () => {
    const plan = new Date("2026-07-12T14:00:00.000Z");
    const real = new Date("2026-07-12T14:20:00.000Z");
    const origin = stop({
      id: "s1",
      sequenceOrder: 1,
      stopType: [StopType.ORIGIN],
      estimatedDeparture: plan,
      actualDeparture: real,
      status: StopStatus.COMPLETED,
    });
    const lines = buildStopPlanRealLines(origin, "origin");
    expect(lines).toHaveLength(1);
    expect(lines[0]?.kind).toBe("departure");
    expect(lines[0]?.summary).toBe(
      trackingCopy.label.planVsRealDeparture(
        formatTime(plan.toISOString()),
        formatTime(real.toISOString()),
      ),
    );
  });

  it("destination shows only arrival plan/real", () => {
    const plan = new Date("2026-07-12T20:00:00.000Z");
    const dest = stop({
      id: "s3",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION],
      estimatedArrival: plan,
      actualArrival: null,
      status: StopStatus.PENDING,
    });
    const lines = buildStopPlanRealLines(dest, "destination");
    expect(lines).toHaveLength(1);
    expect(lines[0]?.kind).toBe("arrival");
    expect(lines[0]?.realValue).toBe("—");
    expect(lines[0]?.summary).toBe(
      trackingCopy.label.planVsRealArrival(
        formatTime(plan.toISOString()),
        "—",
      ),
    );
  });

  it("waypoint shows arrival and departure lines", () => {
    const arrivalPlan = new Date("2026-07-12T16:00:00.000Z");
    const arrivalReal = new Date("2026-07-12T16:15:00.000Z");
    const departurePlan = new Date("2026-07-12T17:00:00.000Z");
    const waypoint = stop({
      id: "s2",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT],
      status: StopStatus.IN_PROGRESS,
      estimatedArrival: arrivalPlan,
      actualArrival: arrivalReal,
      estimatedDeparture: departurePlan,
      actualDeparture: null,
    });
    const lines = buildStopPlanRealLines(waypoint, "waypoint");
    expect(lines.map((l) => l.kind)).toEqual(["arrival", "departure"]);
    expect(lines[1]?.realValue).toBe("—");
  });

  it("origin falls back to trip scheduledDeparture for plan", () => {
    const scheduled = new Date("2026-07-12T09:00:00.000Z");
    const origin = stop({
      id: "s1",
      sequenceOrder: 1,
      stopType: [StopType.ORIGIN],
      estimatedDeparture: null,
      actualDeparture: null,
    });
    const lines = buildStopPlanRealLines(origin, "origin", {
      scheduledDeparture: scheduled,
    });
    expect(lines[0]?.planValue).toBe(formatTime(scheduled.toISOString()));
  });
});
