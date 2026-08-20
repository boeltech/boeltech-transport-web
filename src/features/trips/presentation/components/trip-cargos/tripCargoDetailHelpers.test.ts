import { describe, expect, it } from "vitest";

import type {
  CreateCargoInput,
  TripCargo,
  TripStop,
} from "@features/trips/domain";

import {
  attachStopIdsToCreateCargoMovements,
  formatCargoRouteLine,
  getCargoPlanningStops,
} from "./tripCargoDetailHelpers";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.cargo;

function stop(id: string, sequenceOrder: number, locationName?: string): TripStop {
  return {
    id,
    stopType: ["pickup"],
    address: "Calle",
    city: "Monterrey",
    locationName,
    sequenceOrder,
  } as TripStop;
}

function cargoWithMovements(
  movements: CreateCargoInput["movements"],
): CreateCargoInput {
  return {
    clientId: "client-1",
    description: "Harina",
    movements,
  };
}

describe("attachStopIdsToCreateCargoMovements", () => {
  it("attaches stopId from orderedStops by stopIndex", () => {
    const orderedStops = [stop("st-1", 0), stop("st-2", 1)];
    const result = attachStopIdsToCreateCargoMovements(
      cargoWithMovements([
        { stopIndex: 0, movementType: "pickup" },
        { stopIndex: 1, movementType: "delivery", weight: 10, units: 1 },
      ]),
      orderedStops,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cargo.movements).toEqual([
      { stopIndex: 0, movementType: "pickup", stopId: "st-1" },
      {
        stopIndex: 1,
        movementType: "delivery",
        weight: 10,
        units: 1,
        stopId: "st-2",
      },
    ]);
  });

  it("returns unresolved indexes when stopIndex is out of range", () => {
    const result = attachStopIdsToCreateCargoMovements(
      cargoWithMovements([{ stopIndex: 5, movementType: "pickup" }]),
      [stop("st-1", 0)],
    );

    expect(result).toEqual({
      ok: false,
      unresolvedStopIndexes: [5],
    });
  });

  it("passes through cargo without movements", () => {
    const cargo = cargoWithMovements(undefined);
    const result = attachStopIdsToCreateCargoMovements(cargo, [
      stop("st-1", 0),
    ]);

    expect(result).toEqual({ ok: true, cargo });
  });
});

describe("getCargoPlanningStops / formatCargoRouteLine", () => {
  it("builds pickup → delivery labels from movements", () => {
    const orderedStops = [
      stop("st-1", 0, "Bodega"),
      stop("st-2", 1, "Cliente"),
    ];
    const cargo = {
      id: "c1",
      description: "Harina",
      movements: [
        { stopIndex: 0, movementType: "pickup", stopId: "st-1" },
        { stopIndex: 1, movementType: "delivery", stopId: "st-2" },
      ],
    } as TripCargo;

    const planning = getCargoPlanningStops(cargo, orderedStops);
    expect(planning.pickupLabel).toContain("Bodega");
    expect(planning.deliveryLabels[0]).toContain("Cliente");
    expect(formatCargoRouteLine(cargo, orderedStops)).toContain("→");
  });

  it("uses missing labels when movements are absent", () => {
    const cargo = {
      id: "c1",
      description: "Harina",
      movements: [],
    } as unknown as TripCargo;

    expect(formatCargoRouteLine(cargo, [])).toBe(
      copy.format.routeSummary(
        copy.state.missingPickup,
        copy.state.missingDelivery,
      ),
    );
  });
});
