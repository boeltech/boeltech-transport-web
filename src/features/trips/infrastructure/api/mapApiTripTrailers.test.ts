import { describe, expect, it } from "vitest";
import { mapApiTrip, mapApiTripTrailer } from "./mappers";
import type { ApiTripResponse, ApiTripTrailerResponse } from "./api-types";

describe("mapApiTripTrailer", () => {
  it("maps snapshot assignment to TripTrailerRef", () => {
    const raw: ApiTripTrailerResponse = {
      trailer_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      position: 1,
      sat_sub_tipo_rem_code: "CTR001",
      license_plate: "REM1234",
      snapshot_at: "2026-08-01T12:00:00.000Z",
    };
    expect(mapApiTripTrailer(raw)).toEqual({
      trailerId: raw.trailer_id,
      position: 1,
      satSubTipoRemCode: "CTR001",
      licensePlate: "REM1234",
      snapshotAt: raw.snapshot_at,
    });
  });

  it("coerces unexpected position to 1", () => {
    const raw: ApiTripTrailerResponse = {
      trailer_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      position: 9,
      sat_sub_tipo_rem_code: "CTR001",
      license_plate: "REM1234",
      snapshot_at: "2026-08-01T12:00:00.000Z",
    };
    expect(mapApiTripTrailer(raw).position).toBe(1);
  });
});

describe("mapApiTrip trailers", () => {
  it("maps trailers array on detail response", () => {
    const trip = mapApiTrip({
      id: "trip-1",
      tenant_id: "tenant-1",
      trip_code: "V-1",
      vehicle_id: "veh-1",
      driver_id: "drv-1",
      client_id: null,
      origin_branch_id: null,
      status: "draft",
      cfdi_document_intent: "ingreso",
      scheduled_departure: "2026-08-01T12:00:00.000Z",
      scheduled_arrival: null,
      actual_departure: null,
      actual_arrival: null,
      start_mileage: null,
      end_mileage: null,
      origin_city: "QRO",
      origin_state: null,
      destination_city: "CDMX",
      destination_state: null,
      cargo_description: null,
      cargo_weight: null,
      cargo_volume: null,
      cargo_units: null,
      cargo_value: null,
      base_rate: 0,
      fuel_cost: 0,
      toll_cost: 0,
      other_costs: 0,
      total_cost: 0,
      notes: null,
      cancellation_reason: null,
      total_dist_rec: null,
      id_ccp: null,
      created_at: "2026-08-01T12:00:00.000Z",
      updated_at: "2026-08-01T12:00:00.000Z",
      created_by: null,
      updated_by: null,
      trailers: [
        {
          trailer_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          position: 2,
          sat_sub_tipo_rem_code: "CTR002",
          license_plate: "REM9999",
          snapshot_at: "2026-08-01T12:00:00.000Z",
        },
      ],
    } as ApiTripResponse);

    expect(trip.trailers).toHaveLength(1);
    expect(trip.trailers?.[0]).toMatchObject({
      position: 2,
      licensePlate: "REM9999",
      satSubTipoRemCode: "CTR002",
    });
  });
});
