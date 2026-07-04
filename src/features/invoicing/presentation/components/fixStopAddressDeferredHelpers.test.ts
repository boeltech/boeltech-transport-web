import { describe, expect, it } from "vitest";
import type { TripStop } from "@features/trips/domain";
import {
  buildInlineAddressParsePayload,
  buildInlineStopAddressDefaultValues,
  tripStopAddressDiffersFromInlinePayload,
} from "./fixStopAddressDeferredHelpers";

function buildStop(overrides: Partial<TripStop> = {}): TripStop {
  return {
    id: "stop-1",
    tenantId: "tenant-1",
    tripId: "trip-1",
    sequenceOrder: 1,
    stopType: ["waypoint"],
    addressId: null,
    clientId: null,
    clientAddressId: null,
    address: "",
    city: "",
    state: null,
    postalCode: "76343",
    latitude: 20.1,
    longitude: -99.1,
    locationName: "Escala",
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: "pending",
    notes: null,
    idUbicacion: null,
    street: "Calle Actual",
    exteriorNumber: "100",
    interiorNumber: null,
    colonia: null,
    reference: null,
    satCountryCode: "MEX",
    satEstadoCode: "QUE",
    satMunicipioCode: "014",
    satLocalidadCode: null,
    satColoniaCode: null,
    rfcRemitenteDestinatario: null,
    nombreRemitenteDestinatario: null,
    deliveryRfcRemitenteDestinatario: null,
    deliveryNombreRemitenteDestinatario: null,
    remitentePartnerId: null,
    destinatarioPartnerId: null,
    distanceFromPreviousKm: 100,
    distanceSource: null,
    distanceProvider: null,
    distanceConfidence: null,
    distanceComputedAt: null,
    ...overrides,
  };
}

describe("fixStopAddressDeferredHelpers", () => {
  it("buildInlineStopAddressDefaultValues uses camelCase keys for AddressInput", () => {
    const values = buildInlineStopAddressDefaultValues(buildStop());
    expect(values).toMatchObject({
      addressType: "trip_stop",
      postalCode: "76343",
      satStateCode: "QUE",
      street: "Calle Actual",
    });
    expect(values).not.toHaveProperty("postal_code");
  });

  it("buildInlineAddressParsePayload merges fiscal fields from stop", () => {
    const stop = buildStop({
      rfcRemitenteDestinatario: null,
      deliveryRfcRemitenteDestinatario: "XIA190128J61",
      deliveryNombreRemitenteDestinatario: "Cliente Demo",
    });
    const payload = buildInlineAddressParsePayload(
      stop,
      buildInlineStopAddressDefaultValues(stop),
    );
    expect(payload.rfcRemitenteDestinatario).toBe("XIA190128J61");
    expect(payload.nombreRemitenteDestinatario).toBe("Cliente Demo");
    expect(payload.stopType).toEqual(["waypoint"]);
  });

  it("tripStopAddressDiffersFromInlinePayload detects street changes", () => {
    const stop = buildStop();
    expect(
      tripStopAddressDiffersFromInlinePayload(stop, {
        street: "Calle Actual",
        postal_code: "76343",
        sat_state_code: "QUE",
        exterior_number: "100",
        sat_country_code: "MEX",
      }),
    ).toBe(false);
    expect(
      tripStopAddressDiffersFromInlinePayload(stop, {
        street: "Calle Nueva",
        postal_code: "76343",
        sat_state_code: "QUE",
        exterior_number: "100",
        sat_country_code: "MEX",
      }),
    ).toBe(true);
  });
});
