import { describe, expect, it } from "vitest";

import {
  CargoStatus,
  StopType,
  TripStatus,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import {
  listOperatePendingCargoActions,
  resolveOperateCargoCtaLabel,
} from "./operateCargoActions";
import { trackingCopy } from "./trackingCopy";

function stop(partial: Partial<TripStop> & Pick<TripStop, "id">): TripStop {
  return {
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN],
    locationName: "Bodega",
    status: "in_progress",
    actualArrival: new Date("2026-01-01T09:00:00Z"),
    actualDeparture: null,
    addressId: null,
    scheduledArrival: null,
    scheduledDeparture: null,
    notes: null,
    ...partial,
  } as TripStop;
}

function cargo(
  partial: Partial<TripCargo> & Pick<TripCargo, "id" | "movements">,
): TripCargo {
  return {
    description: "Zapatos",
    status: CargoStatus.PENDING,
    weight: null,
    weightInKg: null,
    units: null,
    ...partial,
  } as TripCargo;
}

describe("listOperatePendingCargoActions", () => {
  const origin = stop({ id: "s1" });
  const destination = stop({
    id: "s2",
    sequenceOrder: 2,
    stopType: [StopType.DESTINATION],
    status: "pending",
    actualArrival: null,
    locationName: "Cliente",
  });

  it("lista pickup pendiente en visita activa", () => {
    const items = listOperatePendingCargoActions(
      origin,
      [
        cargo({
          id: "c1",
          movements: [
            {
              id: "m1",
              movementType: "pickup",
              stopId: "s1",
              stopIndex: 1,
              completedAt: null,
              weight: null,
              units: null,
              notes: null,
            },
          ],
        }),
      ],
      [origin, destination],
      TripStatus.IN_PROGRESS,
    );
    expect(items).toEqual([
      { cargoId: "c1", description: "Zapatos", action: "pickup" },
    ]);
  });

  it("no lista si la visita no está activa (DOM gate)", () => {
    const pendingOrigin = stop({
      id: "s1",
      status: "pending",
      actualArrival: null,
    });
    const items = listOperatePendingCargoActions(
      pendingOrigin,
      [
        cargo({
          id: "c1",
          movements: [
            {
              id: "m1",
              movementType: "pickup",
              stopId: "s1",
              stopIndex: 1,
              completedAt: null,
              weight: null,
              units: null,
              notes: null,
            },
          ],
        }),
      ],
      [pendingOrigin, destination],
      TripStatus.IN_PROGRESS,
    );
    expect(items).toEqual([]);
  });
});

describe("resolveOperateCargoCtaLabel", () => {
  it("1 pickup → Marcar recogida", () => {
    expect(
      resolveOperateCargoCtaLabel(
        [{ cargoId: "c1", description: "A", action: "pickup" }],
        "Bodega QRO",
      ),
    ).toBe(trackingCopy.action.markPickup);
  });

  it("N → Registrar cargas en {parada}", () => {
    expect(
      resolveOperateCargoCtaLabel(
        [
          { cargoId: "c1", description: "A", action: "pickup" },
          { cargoId: "c2", description: "B", action: "pickup" },
        ],
        "Bodega QRO",
      ),
    ).toBe(trackingCopy.action.registerCargosAtStop("Bodega QRO"));
  });
});
