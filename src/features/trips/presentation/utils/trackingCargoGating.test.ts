import { describe, expect, it } from "vitest";

import {
  CargoStatus,
  StopType,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import {
  canOperateCargoAtStop,
  hasUnresolvedCargoAtStop,
  validateCargoBeforeDeparture,
} from "./trackingCargoGating";

const STOP_DEFAULTS = {
  tenantId: "t1",
  tripId: "trip-1",
  addressId: null,
  clientId: null,
  clientAddressId: null,
  address: "",
  city: "",
  state: null,
  postalCode: null,
  latitude: null,
  longitude: null,
  locationName: "Origen",
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  estimatedDeparture: null,
  status: "in_progress" as const,
  notes: null,
  idUbicacion: null,
  rfcRemitenteDestinatario: null,
  distanceFromPreviousKm: null,
  distanceSource: null,
  distanceProvider: null,
  distanceConfidence: null,
  distanceComputedAt: null,
  cargoActionDescription: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function stop(overrides: Partial<TripStop> & Pick<TripStop, "id" | "sequenceOrder" | "stopType">): TripStop {
  return { ...STOP_DEFAULTS, ...overrides } as TripStop;
}

function cargo(overrides: Partial<TripCargo> & Pick<TripCargo, "id" | "description">): TripCargo {
  return {
    tenantId: "t1",
    tripId: "trip-1",
    clientId: "c1",
    productType: null,
    weight: 1000,
    volume: null,
    units: null,
    declaredValue: null,
    rate: 0,
    currency: "MXN",
    status: CargoStatus.PENDING,
    pickedUpAt: null,
    deliveredAt: null,
    movements: [
      {
        id: "m1",
        cargoId: overrides.id,
        stopId: "origin",
        stopIndex: 0,
        movementType: "pickup",
        weight: null,
        units: null,
        completedAt: null,
        notes: null,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as TripCargo;
}

describe("trackingCargoGating", () => {
  const origin = stop({
    id: "origin",
    sequenceOrder: 0,
    stopType: [StopType.ORIGIN],
    actualArrival: new Date("2026-06-01T10:00:00Z"),
    actualDeparture: null,
  });

  it("blocks departure when pickup pending at origin", () => {
    const route = [origin];
    expect(hasUnresolvedCargoAtStop(origin, [cargo({ id: "c1", description: "Harina" })], route)).toBe(true);
    expect(
      validateCargoBeforeDeparture(origin, [cargo({ id: "c1", description: "Harina" })], route),
    ).toContain("Harina");
  });

  it("allows departure after pickup", () => {
    const route = [origin];
    const picked = cargo({
      id: "c1",
      description: "Harina",
      status: CargoStatus.IN_TRANSIT,
    });
    expect(hasUnresolvedCargoAtStop(origin, [picked], route)).toBe(false);
    expect(validateCargoBeforeDeparture(origin, [picked], route)).toBeNull();
  });

  it("requires visit active to operate cargo", () => {
    const notArrived = stop({
      id: "origin",
      sequenceOrder: 0,
      stopType: [StopType.ORIGIN],
      actualArrival: null,
      actualDeparture: null,
    });
    expect(canOperateCargoAtStop(notArrived, "in_progress")).toBe(false);
    expect(canOperateCargoAtStop(origin, "in_progress")).toBe(true);
  });
});
