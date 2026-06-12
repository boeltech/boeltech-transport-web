import { describe, expect, it } from "vitest";

import { StopStatus, StopType } from "./enums";
import type { TripStop } from "./entities";
import { calculateStopsProgress, countCompletedStops } from "./rules";

function stop(overrides: Partial<TripStop>): TripStop {
  return {
    id: "stop-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    sequenceOrder: 0,
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
    status: StopStatus.PENDING,
    notes: null,
    idUbicacion: null,
    street: null,
    exteriorNumber: null,
    interiorNumber: null,
    colonia: null,
    reference: null,
    satCountryCode: "MEX",
    satEstadoCode: null,
    satMunicipioCode: null,
    satLocalidadCode: null,
    satColoniaCode: null,
    rfcRemitenteDestinatario: null,
    nombreRemitenteDestinatario: null,
    deliveryRfcRemitenteDestinatario: null,
    deliveryNombreRemitenteDestinatario: null,
    remitentePartnerId: null,
    destinatarioPartnerId: null,
    distanceFromPreviousKm: null,
    distanceSource: null,
    distanceProvider: null,
    distanceConfidence: null,
    distanceComputedAt: null,
    createdAt: new Date("2026-05-13T00:00:00.000Z"),
    updatedAt: new Date("2026-05-13T00:00:00.000Z"),
    ...overrides,
  };
}

describe("calculateStopsProgress", () => {
  it("returns 0 when there are no stops", () => {
    expect(calculateStopsProgress([])).toBe(0);
    expect(countCompletedStops([])).toBe(0);
  });

  it("counts completed stops, not only actualArrival", () => {
    const stops = [
      stop({
        id: "origin",
        sequenceOrder: 0,
        stopType: [StopType.ORIGIN],
        status: StopStatus.COMPLETED,
        actualDeparture: new Date("2026-05-28T10:00:00.000Z"),
      }),
      stop({
        id: "waypoint",
        sequenceOrder: 1,
        stopType: [StopType.WAYPOINT],
        status: StopStatus.IN_PROGRESS,
        actualArrival: new Date("2026-05-28T14:00:00.000Z"),
      }),
      stop({
        id: "destination",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        status: StopStatus.PENDING,
      }),
    ];

    expect(countCompletedStops(stops)).toBe(1);
    expect(calculateStopsProgress(stops)).toBe(33);
  });

  it("matches tracking timeline percent when all stops are completed", () => {
    const stops = [
      stop({ id: "s0", sequenceOrder: 0, status: StopStatus.COMPLETED }),
      stop({ id: "s1", sequenceOrder: 1, status: StopStatus.COMPLETED }),
      stop({ id: "s2", sequenceOrder: 2, status: StopStatus.COMPLETED }),
    ];

    expect(calculateStopsProgress(stops)).toBe(100);
  });
});
