import { describe, expect, it } from "vitest";

import type { TripStop } from "@features/trips/domain";
import {
  formatTripEndpointLabel,
  formatTripRouteSubtitle,
  formatStopDisplayStreetLine,
} from "./uiHelpers";

function stop(over: Partial<TripStop>): TripStop {
  return {
    id: "stop-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    sequenceOrder: 1,
    stopType: ["origin"],
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
    createdAt: new Date("2026-05-12T00:00:00.000Z"),
    updatedAt: new Date("2026-05-12T00:00:00.000Z"),
    ...over,
  };
}

describe("formatTripRouteSubtitle", () => {
  it("prefers stop location names over legacy SAT municipality codes", () => {
    const subtitle = formatTripRouteSubtitle(
      [
        stop({
          sequenceOrder: 1,
          stopType: ["origin"],
          locationName: "CEDIS Norte",
          city: "039",
          state: "JAL",
        }),
        stop({
          id: "stop-2",
          sequenceOrder: 2,
          stopType: ["destination"],
          locationName: "Planta Sur",
          city: "060",
          state: "JAL",
        }),
      ],
      {
        originCity: "039",
        originState: "JAL",
        destinationCity: "060",
        destinationState: "JAL",
      },
    );

    expect(subtitle).toBe("CEDIS Norte → Planta Sur");
  });

  it("labels bare legacy municipality codes when stops are unavailable", () => {
    expect(
      formatTripEndpointLabel(undefined, { city: "039", state: "JAL" }),
    ).toBe("Municipio 039, JAL");
  });
});

describe("formatStopDisplayStreetLine", () => {
  it("shows street line when location name is the title", () => {
    expect(
      formatStopDisplayStreetLine(
        stop({
          locationName: "Corporativo MTY",
          street: "Av. Vasconcelos",
          exteriorNumber: "402",
          interiorNumber: "12",
        }),
      ),
    ).toBe("Av. Vasconcelos #402, Int. 12");
  });

  it("returns street line from desglosed fields", () => {
    expect(
      formatStopDisplayStreetLine(
        stop({
          locationName: "Corporativo MTY",
          street: "Av. Vasconcelos",
          exteriorNumber: "402",
        }),
      ),
    ).toBe("Av. Vasconcelos #402");
  });

  it("returns null when there is no location name", () => {
    expect(
      formatStopDisplayStreetLine(
        stop({
          street: "Av. Siempre Viva",
          exteriorNumber: "742",
        }),
      ),
    ).toBeNull();
  });
});
