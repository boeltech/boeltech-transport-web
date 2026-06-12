import { describe, expect, it } from "vitest";

import { StopStatus, StopType, type Trip, type TrackingTimeline } from "@features/trips/domain";

import { buildTripRouteDetailView } from "./tripDetailRouteData";

function baseTrip(stops: Trip["stops"]): Trip {
  return {
    id: "trip-1",
    tenantId: "tenant-1",
    tripCode: "VJ-001",
    status: "in_progress",
    scheduledDeparture: new Date("2026-05-28T08:00:00.000Z"),
    scheduledArrival: null,
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: 100_000, end: null },
    stops,
  } as Trip;
}

describe("buildTripRouteDetailView", () => {
  it("uses trip detail when timeline is absent", () => {
    const stops = [
      {
        id: "s0",
        sequenceOrder: 0,
        stopType: [StopType.ORIGIN],
        status: StopStatus.PENDING,
      },
    ] as Trip["stops"];

    const view = buildTripRouteDetailView(baseTrip(stops), undefined);

    expect(view.progress).toBe(0);
    expect(view.orderedStops).toHaveLength(1);
    expect(view.trip.status).toBe("in_progress");
  });

  it("prefers timeline stops and progress for route tab", () => {
    const trip = baseTrip([
      {
        id: "s0",
        sequenceOrder: 0,
        stopType: [StopType.ORIGIN],
        status: StopStatus.PENDING,
      },
    ] as Trip["stops"]);

    const timeline = {
      trip: {
        id: "trip-1",
        tripCode: "VJ-001",
        status: "in_progress" as const,
        scheduledDeparture: null,
        scheduledArrival: null,
        actualDeparture: new Date("2026-05-28T10:00:00.000Z"),
        actualArrival: null,
        startMileage: 100_000,
        endMileage: null,
        hasOpenIncident: false,
        totalDistRec: null,
      },
      progress: {
        stopsTotal: 3,
        stopsCompleted: 1,
        percentComplete: 33,
        distancePlannedKm: 800,
        distanceActualKm: null,
        estimatedArrival: null,
      },
      stops: [
        {
          id: "s0",
          sequenceOrder: 0,
          stopType: [StopType.ORIGIN],
          status: StopStatus.COMPLETED,
          actualDeparture: new Date("2026-05-28T10:00:00.000Z"),
        },
        {
          id: "s1",
          sequenceOrder: 1,
          stopType: [StopType.WAYPOINT],
          status: StopStatus.PENDING,
        },
        {
          id: "s2",
          sequenceOrder: 2,
          stopType: [StopType.DESTINATION],
          status: StopStatus.PENDING,
        },
      ],
      events: [],
      statusHistory: [],
      map: { routeGeojson: null, lastKnownPosition: null },
    } as unknown as TrackingTimeline;

    const view = buildTripRouteDetailView(trip, timeline);

    expect(view.progress).toBe(33);
    expect(view.orderedStops).toHaveLength(3);
    expect(view.orderedStops[0]?.status).toBe(StopStatus.COMPLETED);
    expect(view.trip.actualDeparture).toEqual(timeline.trip.actualDeparture);
  });
});
