import { describe, expect, it } from "vitest";

import { StopType, type TripStop } from "@features/trips/domain";

import {
  findStopAtDock,
  resolveTrackingTrafficLight,
  trackingTrafficLightBadgeVariant,
  trackingTrafficLightLabel,
} from "./trackingTrafficLight";

const NOW = new Date("2026-07-12T12:00:00.000Z");

const STOP_DEFAULTS = {
  id: "stop-1",
  tenantId: "tenant-1",
  tripId: "trip-1",
  sequenceOrder: 1,
  stopType: [StopType.WAYPOINT],
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
  status: "pending",
  notes: null,
  idUbicacion: null,
  rfcRemitenteDestinatario: null,
  distanceFromPreviousKm: null,
  distanceSource: null,
} as const;

function stop(
  overrides: Partial<TripStop> & Pick<TripStop, "id" | "sequenceOrder">,
): TripStop {
  return { ...STOP_DEFAULTS, ...overrides } as TripStop;
}

describe("findStopAtDock", () => {
  it("returns the stop with arrival and no departure", () => {
    const dock = stop({
      id: "s2",
      sequenceOrder: 2,
      actualArrival: new Date("2026-07-12T10:00:00.000Z"),
    });
    const found = findStopAtDock([
      stop({
        id: "s1",
        sequenceOrder: 1,
        stopType: [StopType.ORIGIN],
        actualArrival: new Date("2026-07-12T08:00:00.000Z"),
        actualDeparture: new Date("2026-07-12T09:00:00.000Z"),
      }),
      dock,
    ]);
    expect(found?.id).toBe("s2");
  });

  it("returns undefined when no stop is at dock", () => {
    expect(
      findStopAtDock([
        stop({
          id: "s1",
          sequenceOrder: 1,
          actualArrival: new Date("2026-07-12T08:00:00.000Z"),
          actualDeparture: new Date("2026-07-12T09:00:00.000Z"),
        }),
      ]),
    ).toBeUndefined();
  });
});

describe("resolveTrackingTrafficLight", () => {
  it("returns n/a for scheduled / draft / completed / cancelled", () => {
    for (const tripStatus of [
      "draft",
      "scheduled",
      "completed",
      "cancelled",
    ] as const) {
      expect(
        resolveTrackingTrafficLight({
          tripStatus,
          hasOpenIncident: false,
          now: NOW,
          estimatedArrival: new Date("2026-07-12T10:00:00.000Z"),
          stops: [],
        }),
      ).toBe("n/a");
    }
  });

  it("returns stopped when there is an open incident", () => {
    expect(
      resolveTrackingTrafficLight({
        tripStatus: "in_progress",
        hasOpenIncident: true,
        now: NOW,
        estimatedArrival: new Date("2026-07-12T13:00:00.000Z"),
        stops: [],
      }),
    ).toBe("stopped");
  });

  it("returns delayed when lateness ≥ 90 min vs ETA", () => {
    expect(
      resolveTrackingTrafficLight({
        tripStatus: "in_progress",
        hasOpenIncident: false,
        now: NOW,
        estimatedArrival: new Date("2026-07-12T10:00:00.000Z"), // 120 min late
        stops: [],
      }),
    ).toBe("delayed");
  });

  it("returns at_risk when lateness ≥ 30 min vs ETA", () => {
    expect(
      resolveTrackingTrafficLight({
        tripStatus: "in_progress",
        hasOpenIncident: false,
        now: NOW,
        estimatedArrival: new Date("2026-07-12T11:20:00.000Z"), // 40 min late
        stops: [],
      }),
    ).toBe("at_risk");
  });

  it("falls back to scheduledArrival when ETA is missing", () => {
    expect(
      resolveTrackingTrafficLight({
        tripStatus: "in_progress",
        hasOpenIncident: false,
        now: NOW,
        estimatedArrival: null,
        scheduledArrival: new Date("2026-07-12T10:00:00.000Z"),
        stops: [],
      }),
    ).toBe("delayed");
  });

  it("returns at_risk when dwell at dock ≥ 60 min", () => {
    expect(
      resolveTrackingTrafficLight({
        tripStatus: "in_progress",
        hasOpenIncident: false,
        now: NOW,
        estimatedArrival: new Date("2026-07-12T14:00:00.000Z"), // still on time vs ETA
        stops: [
          stop({
            id: "s2",
            sequenceOrder: 2,
            actualArrival: new Date("2026-07-12T10:30:00.000Z"), // 90 min dwell
          }),
        ],
      }),
    ).toBe("at_risk");
  });

  it("returns on_time when within thresholds", () => {
    expect(
      resolveTrackingTrafficLight({
        tripStatus: "in_progress",
        hasOpenIncident: false,
        now: NOW,
        estimatedArrival: new Date("2026-07-12T12:20:00.000Z"),
        stops: [],
      }),
    ).toBe("on_time");
  });
});

describe("trackingTrafficLightLabel / badgeVariant", () => {
  it("maps PRD labels", () => {
    expect(trackingTrafficLightLabel("on_time")).toBe("A tiempo");
    expect(trackingTrafficLightLabel("at_risk")).toBe("En riesgo");
    expect(trackingTrafficLightLabel("delayed")).toBe("Retrasado");
    expect(trackingTrafficLightLabel("stopped")).toBe("Detenido");
    expect(trackingTrafficLightLabel("n/a")).toBe("No aplica");
  });

  it("maps badge variants", () => {
    expect(trackingTrafficLightBadgeVariant("on_time")).toBe("success");
    expect(trackingTrafficLightBadgeVariant("at_risk")).toBe("warning");
    expect(trackingTrafficLightBadgeVariant("delayed")).toBe("warning");
    expect(trackingTrafficLightBadgeVariant("stopped")).toBe("destructive");
  });
});
