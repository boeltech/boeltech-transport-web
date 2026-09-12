import { describe, expect, it } from "vitest";

import {
  CargoStatus,
  StopType,
  TripOperationalOutcome,
  TripStatus,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import { canQuickCloseTrip } from "./canQuickCloseTrip";

function stop(partial: Partial<TripStop> & Pick<TripStop, "id">): TripStop {
  return {
    sequenceOrder: partial.sequenceOrder ?? 1,
    stopType: partial.stopType ?? [StopType.ORIGIN],
    locationName: "Parada",
    actualArrival: null,
    actualDeparture: null,
    status: "pending",
    ...partial,
  } as TripStop;
}

function cargo(partial: Partial<TripCargo> = {}): TripCargo {
  return {
    id: "c1",
    description: "Carga",
    status: CargoStatus.PENDING,
    movements: [],
    ...partial,
  } as TripCargo;
}

describe("canQuickCloseTrip", () => {
  const origin = stop({
    id: "o1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN],
    actualArrival: new Date("2026-08-16T10:00:00Z"),
    actualDeparture: new Date("2026-08-16T10:30:00Z"),
    status: "completed",
  });
  const waypoint = stop({
    id: "w1",
    sequenceOrder: 2,
    stopType: [StopType.WAYPOINT],
  });
  const destination = stop({
    id: "d1",
    sequenceOrder: 3,
    stopType: [StopType.DESTINATION],
  });

  it("is true for in_progress standard trips without destination cargo block", () => {
    expect(
      canQuickCloseTrip(TripStatus.IN_PROGRESS, [origin, waypoint, destination]),
    ).toBe(true);
  });

  it("is true when origin is done and in_transit cargo awaits destination without visit", () => {
    const inTransit = cargo({
      id: "c-in-transit",
      status: CargoStatus.IN_TRANSIT,
      movements: [
        {
          movementType: "pickup",
          stopId: "o1",
          stopIndex: 0,
        },
        {
          movementType: "delivery",
          stopId: "d1",
          stopIndex: 2,
        },
      ],
    });

    expect(
      canQuickCloseTrip(
        TripStatus.IN_PROGRESS,
        [origin, waypoint, destination],
        [inTransit],
      ),
    ).toBe(true);
  });

  it("is false outside in_progress or for false_trip outcome", () => {
    expect(
      canQuickCloseTrip(TripStatus.SCHEDULED, [origin, destination]),
    ).toBe(false);
    expect(
      canQuickCloseTrip(TripStatus.COMPLETED, [origin, destination]),
    ).toBe(false);
    expect(
      canQuickCloseTrip(TripStatus.CANCELLED, [origin, destination]),
    ).toBe(false);
    expect(
      canQuickCloseTrip(
        TripStatus.IN_PROGRESS,
        [origin, destination],
        [],
        TripOperationalOutcome.FALSE_TRIP,
      ),
    ).toBe(false);
  });

  it("is false when destination has active visit and unresolved cargo", () => {
    const destWithArrival = stop({
      id: "d2",
      sequenceOrder: 3,
      stopType: [StopType.DESTINATION],
      actualArrival: new Date("2026-08-16T14:00:00Z"),
      status: "in_progress",
    });
    const pendingDelivery = cargo({
      id: "c-deliver",
      status: CargoStatus.IN_TRANSIT,
      movements: [
        {
          movementType: "delivery",
          stopId: "d2",
          stopIndex: 2,
        },
      ],
    });

    expect(
      canQuickCloseTrip(
        TripStatus.IN_PROGRESS,
        [origin, destWithArrival],
        [pendingDelivery],
      ),
    ).toBe(false);
  });

  it("remains true when intermediate stop has unresolved cargo but destination does not block", () => {
    const escalaWithArrival = stop({
      id: "w2",
      sequenceOrder: 2,
      stopType: [StopType.WAYPOINT],
      actualArrival: new Date("2026-08-16T12:00:00Z"),
      status: "in_progress",
    });
    const pendingAtEscala = cargo({
      id: "c-pickup",
      status: CargoStatus.PENDING,
      movements: [
        {
          movementType: "pickup",
          stopId: "w2",
          stopIndex: 1,
        },
      ],
    });

    expect(
      canQuickCloseTrip(
        TripStatus.IN_PROGRESS,
        [origin, escalaWithArrival, destination],
        [pendingAtEscala],
      ),
    ).toBe(true);
  });
});
