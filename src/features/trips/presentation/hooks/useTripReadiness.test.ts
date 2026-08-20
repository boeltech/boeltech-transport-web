import { describe, expect, it } from "vitest";

import { computeTripReadiness } from "./useTripReadiness";

const READY_TRIP = {
  clientId: "cli-1",
  vehicleId: "veh-1",
  driverId: "drv-1",
  originCity: "Monterrey",
  destinationCity: "Saltillo",
  scheduledDeparture: "2030-01-15T14:00:00.000Z",
  scheduledArrival: "2030-01-16T18:00:00.000Z",
  startMileage: 1200,
  stops: [{ stopType: ["origin"] }, { stopType: ["destination"] }],
  trailers: [],
  costs: { baseRate: 1500 },
};

function doneIds(
  trip: Parameters<typeof computeTripReadiness>[0],
  options?: Parameters<typeof computeTripReadiness>[1],
) {
  return computeTripReadiness(trip, options)
    .items.filter((item) => item.done)
    .map((item) => item.id);
}

describe("computeTripReadiness", () => {
  it("marks Pedido pending when client is absent", () => {
    const result = computeTripReadiness(
      { ...READY_TRIP, clientId: null },
      { cargoCount: 1 },
    );
    expect(result.items.find((item) => item.id === "order")?.done).toBe(false);
    expect(result.scheduleReady).toBe(false);
  });

  it("marks Pedido done when clientId is present", () => {
    expect(doneIds(READY_TRIP, { cargoCount: 1 })).toContain("order");
  });

  it("marks Flota pending without vehicle or driver", () => {
    expect(
      computeTripReadiness(
        { ...READY_TRIP, vehicleId: "" },
        { cargoCount: 1 },
      ).items.find((item) => item.id === "fleet")?.done,
    ).toBe(false);
    expect(
      computeTripReadiness(
        { ...READY_TRIP, driverId: "  " },
        { cargoCount: 1 },
      ).items.find((item) => item.id === "fleet")?.done,
    ).toBe(false);
  });

  it("marks Flota done with vehicle and driver when there is no SAT config", () => {
    expect(
      computeTripReadiness(READY_TRIP, { cargoCount: 1 }).items.find(
        (item) => item.id === "fleet",
      )?.done,
    ).toBe(true);
  });

  it("requires a trailer when SAT config is S/R", () => {
    const withoutTrailer = computeTripReadiness(READY_TRIP, {
      cargoCount: 1,
      satConfigAutotransporteCode: "T3S2",
    });
    expect(withoutTrailer.items.find((item) => item.id === "fleet")?.done).toBe(
      false,
    );
    expect(withoutTrailer.fleetReady).toBe(false);

    const withTrailer = computeTripReadiness(
      { ...READY_TRIP, trailers: [{ trailerId: "tr-1" }] },
      { cargoCount: 1, satConfigAutotransporteCode: "T3S2" },
    );
    expect(withTrailer.items.find((item) => item.id === "fleet")?.done).toBe(
      true,
    );
  });

  it("marks Paradas pending when there are no stops even if cities exist", () => {
    const result = computeTripReadiness(
      { ...READY_TRIP, stops: [] },
      { cargoCount: 1 },
    );
    expect(result.items.find((item) => item.id === "route")?.done).toBe(false);
    expect(result.items.find((item) => item.id === "cargo")?.tab).toBe("route");
  });

  it("marks Paradas pending when there is a single stop without origin and destination", () => {
    const result = computeTripReadiness(
      {
        ...READY_TRIP,
        originCity: "",
        destinationCity: "",
        stops: [{ stopType: ["origin"] }],
      },
      { cargoCount: 1 },
    );
    expect(result.items.find((item) => item.id === "route")?.done).toBe(false);
    expect(result.items.find((item) => item.id === "cargo")?.tab).toBe("route");
  });

  it("marks Paradas done with origin and destination stops", () => {
    const result = computeTripReadiness(
      {
        ...READY_TRIP,
        originCity: "",
        destinationCity: "",
        stops: [{ stopType: ["origin"] }, { stopType: ["destination"] }],
      },
      { cargoCount: 1 },
    );
    expect(result.items.find((item) => item.id === "route")?.done).toBe(true);
    expect(result.items.find((item) => item.id === "cargo")?.tab).toBe("cargo");
  });

  it("marks Cargas pending when cargoCount is 0", () => {
    const result = computeTripReadiness(READY_TRIP, { cargoCount: 0 });
    expect(result.items.find((item) => item.id === "cargo")?.done).toBe(false);
    expect(result.scheduleReady).toBe(true);
  });

  it("marks Cargas done when cargoCount >= 1", () => {
    const result = computeTripReadiness(READY_TRIP, { cargoCount: 1 });
    expect(result.items.find((item) => item.id === "cargo")?.done).toBe(true);
  });

  it("marks Tarifa pending when baseRate is 0", () => {
    const result = computeTripReadiness(
      { ...READY_TRIP, costs: { baseRate: 0 } },
      { cargoCount: 1 },
    );
    expect(result.items.find((item) => item.id === "rate")?.done).toBe(false);
    expect(result.scheduleReady).toBe(false);
  });

  it("does not require rate for traslado", () => {
    const result = computeTripReadiness(
      { ...READY_TRIP, costs: { baseRate: 0 }, cfdiDocumentIntent: "traslado" },
      { cargoCount: 1 },
    );
    expect(result.items.find((item) => item.id === "rate")?.done).toBe(true);
  });

  it("treats arrival and mileage as schedule blockers, not CP31", () => {
    const result = computeTripReadiness(
      {
        ...READY_TRIP,
        scheduledArrival: null,
        startMileage: null,
      },
      { cargoCount: 1 },
    );
    expect(result.items.map((item) => item.id)).toEqual([
      "order",
      "fleet",
      "departure",
      "arrival",
      "rate",
      "mileage",
      "route",
      "cargo",
    ]);
    expect(result.scheduleReady).toBe(false);
    expect(result.allDone).toBe(false);
  });

  it("is schedule-ready without cargos or stops", () => {
    const result = computeTripReadiness(
      { ...READY_TRIP, stops: [] },
      { cargoCount: 0 },
    );
    expect(result.scheduleReady).toBe(true);
    expect(result.allDone).toBe(false);
  });

  it("does not treat allDone as start eligibility", () => {
    const withoutCargo = computeTripReadiness(READY_TRIP, { cargoCount: 0 });
    expect(withoutCargo.scheduleReady).toBe(true);
    expect(withoutCargo.allDone).toBe(false);
    expect(withoutCargo.items.find((item) => item.id === "cargo")?.done).toBe(
      false,
    );
  });
});
