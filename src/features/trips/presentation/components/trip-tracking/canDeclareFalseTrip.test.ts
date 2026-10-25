import { describe, expect, it } from "vitest";

import {
  CargoStatus,
  StopType,
  TripOperationalOutcome,
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
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [originArrived],
        cargos: [],
      }),
    ).toBe(true);
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [originArrived],
        cargos: [cargo({ status: CargoStatus.PENDING })],
      }),
    ).toBe(true);
  });

  it("is false before any arrival, if a cargo was delivered, or outside in_progress", () => {
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [stop({ id: "s1" })],
      }),
    ).toBe(false);
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [originArrived],
        cargos: [cargo({ status: CargoStatus.DELIVERED })],
      }),
    ).toBe(false);
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.SCHEDULED,
        stops: [originArrived],
      }),
    ).toBe(false);
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.COMPLETED,
        stops: [originArrived],
      }),
    ).toBe(false);
  });

  it("is false when revenue split is active (T4-043 mutex with false_trip)", () => {
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [originArrived],
        cargos: [],
        hasActiveRevenueSplit: true,
      }),
    ).toBe(false);
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [originArrived],
        cargos: [cargo({ status: CargoStatus.PENDING })],
        hasActiveRevenueSplit: true,
      }),
    ).toBe(false);
  });

  it("is false when cfdiEmissionIntent is sin_cfdi_efectivo (T-FALSE / PD11)", () => {
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [originArrived],
        cargos: [],
        cfdiEmissionIntent: "sin_cfdi_efectivo",
      }),
    ).toBe(false);
  });

  it("is false when operationalOutcome is already false_trip", () => {
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [originArrived],
        cargos: [],
        operationalOutcome: TripOperationalOutcome.FALSE_TRIP,
      }),
    ).toBe(false);
  });

  it("allows emitir_cfdi (or omitted intent) when other gates pass", () => {
    expect(
      canDeclareFalseTrip({
        tripStatus: TripStatus.IN_PROGRESS,
        stops: [originArrived],
        cargos: [],
        cfdiEmissionIntent: "emitir_cfdi",
        operationalOutcome: TripOperationalOutcome.STANDARD,
        hasActiveRevenueSplit: false,
      }),
    ).toBe(true);
  });
});
