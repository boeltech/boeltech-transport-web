import { describe, expect, it } from "vitest";

import type { TripCargo, TripStop } from "@features/trips/domain";

import {
  countCargoYardStatus,
  resolveSharedPickupLabel,
  sumCargoUnits,
  sumCargoWeightKg,
} from "./tripCargoSummaryHelpers";

const stops = [
  {
    id: "st-1",
    stopType: ["origin", "pickup"],
    address: "A",
    city: "MTY",
    locationName: "CEDIS Monterrey",
    sequenceOrder: 0,
  },
  {
    id: "st-2",
    stopType: ["destination"],
    address: "B",
    city: "TRC",
    locationName: "CEDIS Torreón",
    sequenceOrder: 1,
  },
] as TripStop[];

function cargo(
  overrides: Partial<TripCargo> & Pick<TripCargo, "id" | "status">,
): TripCargo {
  return {
    description: "Carga",
    units: 2,
    weight: 100,
    weightInKg: 100,
    hazardousMaterial: false,
    movements: [
      {
        id: `mov-${overrides.id}`,
        stopId: "st-1",
        stopIndex: 0,
        movementType: "pickup",
        weight: null,
        units: null,
        completedAt: null,
        notes: null,
      },
    ],
    ...overrides,
  } as TripCargo;
}

describe("tripCargoSummaryHelpers", () => {
  it("counts yard statuses", () => {
    expect(
      countCargoYardStatus([
        cargo({ id: "a", status: "in_transit" }),
        cargo({ id: "b", status: "in_transit" }),
        cargo({ id: "c", status: "delivered" }),
        cargo({ id: "d", status: "pending" }),
      ]),
    ).toEqual({ inTransit: 2, delivered: 1 });
  });

  it("sums units and weight", () => {
    const cargos = [
      cargo({ id: "a", status: "pending", units: 18, weightInKg: 12_400 }),
      cargo({ id: "b", status: "pending", units: 8, weightInKg: 6_200 }),
    ];
    expect(sumCargoUnits(cargos)).toBe(26);
    expect(sumCargoWeightKg(cargos)).toBe(18_600);
  });

  it("resolves shared pickup label or null when mixed", () => {
    const shared = [
      cargo({ id: "a", status: "pending" }),
      cargo({ id: "b", status: "pending" }),
    ];
    expect(resolveSharedPickupLabel(shared, stops)).toBe("#1 CEDIS Monterrey");

    const mixed = [
      ...shared,
      cargo({
        id: "c",
        status: "pending",
        movements: [
          {
            id: "mov-c",
            stopId: "st-2",
            stopIndex: 1,
            movementType: "pickup",
            weight: null,
            units: null,
            completedAt: null,
            notes: null,
          },
        ],
      }),
    ];
    expect(resolveSharedPickupLabel(mixed, stops)).toBeNull();
  });
});
