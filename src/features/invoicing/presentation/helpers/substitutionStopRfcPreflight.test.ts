import { describe, expect, it } from "vitest";

import type { CreateTripStopAddressInput } from "@boeltech/cfdi-domain/validadores/address";
import type { TripStop } from "@features/trips/domain";
import type { TripCorrectionFormEntry } from "../validation/substitutionCorrectionsSchema";
import {
  projectStopRfcPreflightInput,
  runSubstitutionStopsPreflight,
} from "./substitutionStopRfcPreflight";

const STOP_ID = "stop-1";

function buildStopAddress(
  overrides: Partial<CreateTripStopAddressInput> = {},
): CreateTripStopAddressInput {
  return {
    address_type: "trip_stop",
    sat_country_code: "MEX",
    sat_state_code: "19",
    sat_municipality_code: null,
    sat_locality_code: null,
    locality_name: null,
    sat_neighborhood_code: null,
    neighborhood_name: null,
    postal_code: "66600",
    street: "Av Demo",
    exterior_number: "1",
    interior_number: null,
    reference: null,
    location_name: null,
    notes: null,
    latitude: null,
    longitude: null,
    is_primary: false,
    rfc_remitente_destinatario: null,
    nombre_remitente_destinatario: null,
    destinatario_rfc: null,
    destinatario_name: null,
    contact_name: null,
    contact_phone: null,
    contact_email: null,
    business_hours: null,
    special_instructions: null,
    ...overrides,
  };
}

function buildStop(overrides: Partial<TripStop> = {}): TripStop {
  return {
    id: STOP_ID,
    tenantId: "tenant-1",
    tripId: "trip-1",
    sequenceOrder: 0,
    stopType: ["pickup"],
    addressId: "addr-1",
    clientId: "client-1",
    clientAddressId: null,
    address: "",
    city: "",
    state: null,
    postalCode: "64000",
    latitude: null,
    longitude: null,
    locationName: "Origen",
    contactName: null,
    contactPhone: null,
    estimatedArrival: null,
    actualArrival: null,
    estimatedDeparture: null,
    actualDeparture: null,
    status: "pending",
    notes: null,
    idUbicacion: null,
    street: "Calle 1",
    exteriorNumber: "10",
    interiorNumber: null,
    colonia: null,
    reference: null,
    satCountryCode: "MEX",
    satEstadoCode: "19",
    satMunicipioCode: "006",
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
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("substitutionStopRfcPreflight", () => {
  it("projectStopRfcPreflightInput uses stop_address RFC as address remitente", () => {
    const entry: TripCorrectionFormEntry = {
      trip_id: "trip-1",
      stop_id: STOP_ID,
      stop_address: buildStopAddress({
        rfc_remitente_destinatario: "AAA010101AAA",
      }),
      reason: "Corregir domicilio",
    };

    const input = projectStopRfcPreflightInput(buildStop(), entry);

    expect(input.addressRemitenteRfc).toBe("AAA010101AAA");
    expect(input.deliveryRfcRemitenteDestinatario).toBeNull();
  });

  it("runSubstitutionStopsPreflight flags missing RFC after address-only correction", () => {
    const stopsById = new Map([[STOP_ID, buildStop()]]);
    const corrections: TripCorrectionFormEntry[] = [
      {
        trip_id: "trip-1",
        stop_id: STOP_ID,
        stop_address: buildStopAddress(),
        reason: "Corregir domicilio",
      },
    ];

    const result = runSubstitutionStopsPreflight(stopsById, corrections);

    expect(result.ready).toBe(false);
    expect(result.invalidStops[0]?.reason).toBe("RFC_MISSING");
  });

  it("runSubstitutionStopsPreflight passes when stop_address includes RFC", () => {
    const stopsById = new Map([[STOP_ID, buildStop()]]);
    const corrections: TripCorrectionFormEntry[] = [
      {
        trip_id: "trip-1",
        stop_id: STOP_ID,
        stop_address: buildStopAddress({
          rfc_remitente_destinatario: "AAA010101AAA",
        }),
        reason: "Corregir domicilio",
      },
    ];

    const result = runSubstitutionStopsPreflight(stopsById, corrections);

    expect(result.ready).toBe(true);
  });
});
