import { describe, expect, it } from "vitest";
import {
  mapApiCorridor,
  mapApiRouteEstimate,
  mapSnapshotToCreateStops,
  type ApiCorridorResponse,
  type ApiRouteEstimateResponse,
} from "./canvas-mappers";

const rawStop = {
  sequence_order: 3,
  stop_type: ["origin"],
  source_address_id: "addr-1",
  address: null,
  city: "CDMX",
  state: "CMX",
  postal_code: "64000",
  location_name: "CEDIS Norte",
  street: "Av. Industria",
  exterior_number: "100",
  interior_number: null,
  colonia: null,
  reference: null,
  sat_country_code: "MEX",
  sat_state_code: "CMX",
  sat_municipality_code: "015",
  sat_locality_code: null,
  sat_neighborhood_code: null,
  latitude: 19.43,
  longitude: -99.13,
  rfc_remitente_destinatario: null,
  nombre_remitente_destinatario: null,
  contact_name: null,
  contact_phone: null,
};

const rawCorridor: ApiCorridorResponse = {
  corridor_key: "hex-sha256",
  origin_city: "CDMX",
  origin_state: "CMX",
  destination_city: "MTY",
  destination_state: "NLE",
  stop_count: 2,
  trip_count: 12,
  last_used_at: "2026-08-10T18:00:00.000Z",
  sample_trip_id: "trip-sample",
  stops_snapshot: [
    rawStop,
    {
      ...rawStop,
      sequence_order: 7,
      stop_type: ["destination"],
      city: "MTY",
      state: "NLE",
      location_name: "Patio Norte",
      source_address_id: "addr-2",
    },
  ],
};

describe("mapApiCorridor", () => {
  it("maps snake_case to camelCase and omits null snapshot fields", () => {
    const corridor = mapApiCorridor(rawCorridor);

    expect(corridor.corridorKey).toBe("hex-sha256");
    expect(corridor.originCity).toBe("CDMX");
    expect(corridor.originState).toBe("CMX");
    expect(corridor.destinationCity).toBe("MTY");
    expect(corridor.tripCount).toBe(12);
    expect(corridor.lastUsedAt).toBe("2026-08-10T18:00:00.000Z");
    expect(corridor.sampleTripId).toBe("trip-sample");

    const first = corridor.stopsSnapshot[0];
    expect(first?.sequenceOrder).toBe(3);
    expect(first?.stopType).toEqual(["origin"]);
    expect(first?.sourceAddressId).toBe("addr-1");
    expect(first?.city).toBe("CDMX");
    expect(first?.locationName).toBe("CEDIS Norte");
    expect(first?.satCountryCode).toBe("MEX");
    expect(first).not.toHaveProperty("interiorNumber");
    expect(first).not.toHaveProperty("rfcRemitenteDestinatario");
  });
});

describe("mapApiRouteEstimate", () => {
  it("maps snake_case estimate fields", () => {
    const raw: ApiRouteEstimateResponse = {
      fuel_estimate: 4200,
      toll_estimate: 1850,
      total_estimate: 6050,
      currency: "MXN",
      based_on_trips: 8,
      estimated_distance_km: 940,
      vehicle_efficiency_km_l: 3.2,
      adjusted: true,
      disclaimer:
        "Estimado interno con base en viajes completados. No es precio al cliente. Percances no incluidos.",
    };

    const estimate = mapApiRouteEstimate(raw);
    expect(estimate.fuelEstimate).toBe(4200);
    expect(estimate.tollEstimate).toBe(1850);
    expect(estimate.totalEstimate).toBe(6050);
    expect(estimate.currency).toBe("MXN");
    expect(estimate.basedOnTrips).toBe(8);
    expect(estimate.estimatedDistanceKm).toBe(940);
    expect(estimate.vehicleEfficiencyKmL).toBe(3.2);
    expect(estimate.adjusted).toBe(true);
    expect(estimate.disclaimer).toContain("No es precio al cliente");
  });
});

describe("mapSnapshotToCreateStops", () => {
  it("reassigns sequenceOrder 1..N and falls back address to locationName", () => {
    const corridor = mapApiCorridor(rawCorridor);
    const stops = mapSnapshotToCreateStops(corridor.stopsSnapshot);

    expect(stops).toHaveLength(2);
    expect(stops[0]?.sequenceOrder).toBe(1);
    expect(stops[1]?.sequenceOrder).toBe(2);
    expect(stops[0]?.address).toBe("CEDIS Norte");
    expect(stops[0]?.sourceAddressId).toBe("addr-1");
    expect(stops[0]?.city).toBe("CDMX");
    expect(stops[0]).not.toHaveProperty("estimatedArrival");
    expect(stops[0]).not.toHaveProperty("notes");
    expect(stops[0]).not.toHaveProperty("distanceFromPreviousKm");
  });
});
