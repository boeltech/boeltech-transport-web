import { describe, expect, it } from "vitest";

import {
  CargoStatus,
  StopType,
  TripStatus,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import { canDeclareFalseTrip } from "./canDeclareFalseTrip";

function stop(partial: Partial<TripStop> & Pick<TripStop, "id">): TripStop {
  return {
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN],
    locationName: "Origen",
    actualArrival: null,
    actualDeparture: null,
    status: "pending",
    ...partial,
  } as TripStop;
}

function cargo(partial: Partial<TripCargo> = {}): TripCargo {
  return {
    id: "c1",
    status: CargoStatus.PENDING,
    ...partial,
  } as TripCargo;
}

describe("canDeclareFalseTrip", () => {
  const originArrived = stop({
    id: "s1",
    actualArrival: new Date("2026-08-16T12:00:00Z"),
    status: "in_progress",
  });

  it("is true after a real arrival with no delivered cargo", () => {
    expect(
      canDeclareFalseTrip(TripStatus.IN_PROGRESS, [originArrived], []),
    ).toBe(true);
    expect(
      canDeclareFalseTrip(TripStatus.IN_PROGRESS, [originArrived], [
        cargo({ status: CargoStatus.PENDING }),
      ]),
    ).toBe(true);
  });

  it("is false before any arrival, if a cargo was delivered, or outside in_progress", () => {
    expect(
      canDeclareFalseTrip(TripStatus.IN_PROGRESS, [stop({ id: "s1" })]),
    ).toBe(false);
    expect(
      canDeclareFalseTrip(TripStatus.IN_PROGRESS, [originArrived], [
        cargo({ status: CargoStatus.DELIVERED }),
      ]),
    ).toBe(false);
    expect(
      canDeclareFalseTrip(TripStatus.SCHEDULED, [originArrived]),
    ).toBe(false);
    expect(
      canDeclareFalseTrip(TripStatus.COMPLETED, [originArrived]),
    ).toBe(false);
  });
});
