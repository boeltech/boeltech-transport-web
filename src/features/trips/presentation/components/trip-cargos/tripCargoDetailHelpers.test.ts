import { describe, expect, it } from "vitest";

import type { TripCargo, TripStop } from "@features/trips/domain";
import { resolveStopForMovement } from "../../utils/stopCargoCorrelation";
import {
  getStopDisplayOrder,
  getStopLabelForCargo,
} from "./tripCargoDetailHelpers";

function stop(partial: Partial<TripStop> & { id: string; sequenceOrder: number }): TripStop {
  return {
    locationName: partial.locationName ?? `Stop ${partial.sequenceOrder}`,
    city: partial.city ?? "CDMX",
    stopType: partial.stopType ?? ["waypoint"],
    ...partial,
  } as TripStop;
}

describe("trip cargo detail stop display", () => {
  it("shows Parada #1 for origin with sequenceOrder 0", () => {
    const origin = stop({
      id: "s-origin",
      sequenceOrder: 0,
      stopType: ["origin", "pickup"],
      locationName: "Corporativo Tabasco",
    });
    const destination = stop({
      id: "s-dest",
      sequenceOrder: 1,
      stopType: ["destination", "delivery"],
      locationName: "Bodega",
    });
    const ordered = [origin, destination];

    expect(getStopDisplayOrder(origin, ordered)).toBe(1);
    expect(getStopLabelForCargo(0, ordered)).toBe("#1 Corporativo Tabasco");
  });

  it("groups pickup by 0-based stopIndex via resolveStopForMovement", () => {
    const origin = stop({
      id: "s-origin",
      sequenceOrder: 0,
      stopType: ["origin", "pickup"],
    });
    const destination = stop({
      id: "s-dest",
      sequenceOrder: 1,
      stopType: ["destination", "delivery"],
    });
    const ordered = [origin, destination];

    const cargo = {
      id: "c1",
      movements: [
        { movementType: "pickup", stopIndex: 0 },
        { movementType: "delivery", stopIndex: 1 },
      ],
    } as unknown as TripCargo;

    const pickup = cargo.movements!.find((m) => m.movementType === "pickup")!;
    expect(resolveStopForMovement(pickup, ordered)?.id).toBe("s-origin");

    const pickupGroups = [origin].map((s) => ({
      stop: s,
      items: [cargo].filter((c) =>
        c.movements?.some((movement) => {
          if (movement.movementType !== "pickup") return false;
          return resolveStopForMovement(movement, ordered)?.id === s.id;
        }),
      ),
    }));

    expect(pickupGroups[0]?.items).toHaveLength(1);
  });
});
