import { describe, expect, it } from "vitest";

import type { CreateTripInput } from "@features/trips/domain";

import { buildUpdateTripInputFromCreateInput } from "./updateTripPayloadShared";

describe("buildUpdateTripInputFromCreateInput", () => {
  it("preserva startMileage para que el odómetro se persista en edición", () => {
    const base = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      scheduledDeparture: "2030-01-15T20:00:00.000Z",
      scheduledArrival: "2030-01-16T20:00:00.000Z",
      startMileage: 755,
      originCity: "CDMX",
      destinationCity: "MTY",
      baseRate: 35000,
    } satisfies CreateTripInput;

    const update = buildUpdateTripInputFromCreateInput(base);

    expect(update.startMileage).toBe(755);
  });

  it("preserva trailers y satConfigAutotransporteCode (ADR-0077)", () => {
    const trailerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const base = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      scheduledDeparture: "2030-01-15T20:00:00.000Z",
      startMileage: 100,
      originCity: "CDMX",
      destinationCity: "MTY",
      trailers: [{ trailerId, position: 1 as const }],
      satConfigAutotransporteCode: "T3S2",
    } satisfies CreateTripInput;

    const update = buildUpdateTripInputFromCreateInput(base);
    expect(update.trailers).toEqual([{ trailerId, position: 1 }]);
    expect(update.satConfigAutotransporteCode).toBe("T3S2");
  });
});
