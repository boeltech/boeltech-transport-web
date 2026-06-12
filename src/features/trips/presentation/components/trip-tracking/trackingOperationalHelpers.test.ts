import { describe, expect, it } from "vitest";

import {
  CargoStatus,
  StopType,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";

import { progressCopy } from "../../copy/tripDetail/progressCopy";

import {
  buildTrackingItineraryRows,
  getTrackingNextActionLabel,
  resolveTrackingNextAction,
} from "./trackingOperationalHelpers";

const STOP_DEFAULTS = {
  id: "stop-1",
  tenantId: "tenant-1",
  tripId: "trip-1",
  sequenceOrder: 1,
  stopType: [StopType.ORIGIN],
  addressId: null,
  clientId: null,
  clientAddressId: null,
  address: "",
  city: "",
  state: null,
  postalCode: null,
  latitude: null,
  longitude: null,
  locationName: null,
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: "pending",
  notes: null,
  idUbicacion: null,
  rfcRemitenteDestinatario: null,
  distanceFromPreviousKm: null,
  distanceSource: null,
} as const;

function stop(overrides: Partial<TripStop> & Pick<TripStop, "id" | "sequenceOrder" | "stopType">): TripStop {
  return { ...STOP_DEFAULTS, ...overrides } as TripStop;
}

describe("trackingOperationalHelpers", () => {
  const origin = stop({
    id: "s1",
    sequenceOrder: 1,
    stopType: [StopType.ORIGIN],
    actualDeparture: new Date("2026-01-01T10:00:00Z"),
  });
  const waypoint = stop({
    id: "s2",
    sequenceOrder: 2,
    stopType: [StopType.WAYPOINT],
  });
  const destination = stop({
    id: "s3",
    sequenceOrder: 3,
    stopType: [StopType.DESTINATION],
  });

  it("resolves register_arrival when next manual stop has no arrival", () => {
    expect(resolveTrackingNextAction([origin, waypoint, destination])).toBe(
      "register_arrival",
    );
  });

  it("highlights waypoint as next arrival target", () => {
    const rows = buildTrackingItineraryRows([origin, waypoint, destination]);
    const wp = rows.find((row) => row.stop.id === "s2");
    expect(wp?.nextAction).toBe("register_arrival");
    expect(wp?.isActionTarget).toBe(true);
  });

  it("resolves register_departure when escala has arrival without departure", () => {
    const atScale = {
      ...waypoint,
      actualArrival: new Date("2026-01-01T12:00:00Z"),
    };
    expect(resolveTrackingNextAction([origin, atScale, destination])).toBe(
      "register_departure",
    );
    const rows = buildTrackingItineraryRows([origin, atScale, destination]);
    expect(rows.find((r) => r.stop.id === "s2")?.visitState).toBe("at_stop");
    expect(rows.find((r) => r.stop.id === "s2")?.visitLabel).toBe(
      progressCopy.label.stopAtWaypoint,
    );
  });

  it("label for close_at_destination is Finalizar viaje", () => {
    expect(getTrackingNextActionLabel("close_at_destination")).toBe(
      "Finalizar viaje",
    );
  });

  it("resolves close_at_destination when destino has arrival pending trip closure", () => {
    const destArrived = {
      ...destination,
      actualArrival: new Date("2026-01-01T18:00:00Z"),
    };
    const scaleDone = {
      ...waypoint,
      actualArrival: new Date("2026-01-01T12:00:00Z"),
      actualDeparture: new Date("2026-01-01T13:00:00Z"),
    };
    expect(
      resolveTrackingNextAction([origin, scaleDone, destArrived]),
    ).toBe("close_at_destination");
  });

  it("returns resolve_cargo_at_stop when origin departure blocked by pending cargo", () => {
    const originAwaiting = stop({
      id: "s1",
      sequenceOrder: 1,
      stopType: [StopType.ORIGIN],
      actualArrival: new Date("2026-01-01T09:00:00Z"),
      actualDeparture: null,
    });
    const pendingCargo = {
      id: "c1",
      tenantId: "tenant-1",
      tripId: "trip-1",
      clientId: "client-1",
      description: "Harina",
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
          cargoId: "c1",
          stopId: "s1",
          stopIndex: 0,
          movementType: "pickup" as const,
          weight: null,
          units: null,
          completedAt: null,
          notes: null,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TripCargo;

    expect(
      resolveTrackingNextAction(
        [originAwaiting, waypoint, destination],
        [pendingCargo],
      ),
    ).toBe("resolve_cargo_at_stop");
  });
});
