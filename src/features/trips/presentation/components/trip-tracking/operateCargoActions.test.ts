import { describe, expect, it } from "vitest";

import {
  CargoStatus,
  StopType,
  TripStatus,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import {
  getCargoActionsForStopLink,
  listOperatePendingCargoActions,
  resolveOperateCargoCtaLabel,
} from "./operateCargoActions";
import { resolveReturnStopLabelMap } from "./planReturnHelpers";
import { trackingCopy } from "./trackingCopy";
import type { StopCargoLink } from "../../utils/stopCargoCorrelation";

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

describe("getCargoActionsForStopLink (F4c R7)", () => {
  const origin = stop({
    id: "origin",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN, StopType.PICKUP],
    status: "completed",
    locationName: "CEDIS Monterrey",
    city: "Monterrey",
    sourceAddressId: "addr-mty",
    latitude: 25.67,
    longitude: -100.31,
    actualArrival: new Date("2026-01-01T08:00:00Z"),
    actualDeparture: new Date("2026-01-01T09:00:00Z"),
  });
  const unload = stop({
    id: "unload",
    sequenceOrder: 2,
    stopType: [StopType.WAYPOINT, StopType.DELIVERY],
    status: "completed",
    locationName: "Cliente Saltillo",
    actualArrival: new Date("2026-01-01T11:00:00Z"),
    actualDeparture: new Date("2026-01-01T12:00:00Z"),
  });
  const returnStop = stop({
    id: "return-mty",
    sequenceOrder: 3,
    stopType: [StopType.DESTINATION, StopType.DELIVERY],
    status: "in_progress",
    locationName: "CEDIS Monterrey",
    city: "Monterrey",
    sourceAddressId: "addr-mty",
    latitude: 25.67,
    longitude: -100.31,
    actualArrival: new Date("2026-01-01T16:00:00Z"),
  });

  const returnedCargo = cargo({
    id: "cargo-harina",
    description: "Harina",
    status: CargoStatus.RETURNED,
    movements: [
      {
        id: "m-pick",
        movementType: "pickup",
        stopId: "origin",
        stopIndex: 0,
        completedAt: new Date("2026-01-01T09:00:00Z"),
        weight: null,
        units: null,
        notes: null,
      },
      {
        id: "m-del",
        movementType: "delivery",
        stopId: "return-mty",
        stopIndex: 2,
        completedAt: null,
        weight: null,
        units: null,
        notes: null,
      },
    ],
  });

  const companion = cargo({
    id: "cargo-abarrotes",
    description: "Abarrotes",
    status: CargoStatus.IN_TRANSIT,
    movements: [
      {
        id: "m2-pick",
        movementType: "pickup",
        stopId: "origin",
        stopIndex: 0,
        completedAt: new Date("2026-01-01T09:00:00Z"),
        weight: null,
        units: null,
        notes: null,
      },
      {
        id: "m2-del",
        movementType: "delivery",
        stopId: "return-mty",
        stopIndex: 2,
        completedAt: null,
        weight: null,
        units: null,
        notes: null,
      },
    ],
  });

  const ordered = [origin, unload, returnStop];

  it("CA-R13: returned en R7 (también in_progress) → cero CTAs", () => {
    const map = resolveReturnStopLabelMap([returnedCargo, companion], ordered);
    expect(map.get("return-mty")?.cargo.id).toBe("cargo-harina");

    const link: StopCargoLink = {
      cargo: returnedCargo,
      movementType: "delivery",
      movement: returnedCargo.movements![1]!,
    };
    expect(
      getCargoActionsForStopLink(link, true, returnStop, {
        returnLabelMap: map,
      }),
    ).toEqual([]);
  });

  it("CA-R14: in_transit compañera en R7 → Entregar·Devolver·Cancelar", () => {
    const map = resolveReturnStopLabelMap([returnedCargo, companion], ordered);
    const link: StopCargoLink = {
      cargo: companion,
      movementType: "delivery",
      movement: companion.movements![1]!,
    };
    expect(
      getCargoActionsForStopLink(link, true, returnStop, {
        returnLabelMap: map,
      }),
    ).toEqual(["deliver", "return", "cancel"]);
  });

  it("CA-R15: unload no-R7 in_transit → descarga normal intacta", () => {
    const normalUnload = stop({
      id: "s-normal",
      sequenceOrder: 2,
      stopType: [StopType.DELIVERY, StopType.DESTINATION],
      status: "in_progress",
      locationName: "Bodega Saltillo",
      actualArrival: new Date("2026-01-01T13:00:00Z"),
    });
    const normalCargo = cargo({
      id: "c-normal",
      status: CargoStatus.IN_TRANSIT,
      movements: [
        {
          id: "mn",
          movementType: "delivery",
          stopId: "s-normal",
          stopIndex: 1,
          completedAt: null,
          weight: null,
          units: null,
          notes: null,
        },
      ],
    });
    const link: StopCargoLink = {
      cargo: normalCargo,
      movementType: "delivery",
      movement: normalCargo.movements![0]!,
    };
    const map = resolveReturnStopLabelMap([normalCargo], [origin, normalUnload]);
    expect(map.size).toBe(0);
    expect(
      getCargoActionsForStopLink(link, true, normalUnload, {
        returnLabelMap: map,
      }),
    ).toEqual(["deliver", "return", "cancel"]);
  });
});
