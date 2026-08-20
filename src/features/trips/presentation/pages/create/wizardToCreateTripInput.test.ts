import { describe, expect, it } from "vitest";

import { deepToSnake } from "@shared/api/utils/case-transformer";
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";
import { StopType, type ClientCorridor, type CreateStopInput } from "@features/trips/domain";

import { replaceStopsFromCorridor } from "../../components/trip-route/buildReplaceStopsPayload";
import { buildCreateTripInputFromWizardValues } from "./wizardToCreateTripInput";
import { validateCreateTripApiPayload } from "./validateTripApiPayload";
import type { TripWizardFormValues } from "./components/validation";

describe("buildCreateTripInputFromWizardValues — reserve", () => {
  it("builds payload without stops/cargos and options.createIntent=reserve", () => {
    const values = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      scheduledDeparture: "2030-01-15T14:00",
      scheduledArrival: "",
      startMileage: 12000,
      originCity: "CDMX",
      destinationCity: "MTY",
      notes: "Canal: WhatsApp · Pedido verbal",
      baseRate: 35000,
      cfdiDocumentIntent: "ingreso",
      originBranchId: "",
      stops: [],
      cargos: [],
      expenses: [],
      internalStaff: [],
    } as unknown as TripWizardFormValues;

    const payload = buildCreateTripInputFromWizardValues(values, undefined, {
      createIntent: "reserve",
    });

    expect(payload.stops).toBeUndefined();
    expect(payload.cargos).toBeUndefined();
    expect(payload.estimatedExpenses).toBeUndefined();
    expect(payload.startMileage).toBe(12000);
    expect(payload.options).toEqual({ createIntent: "reserve" });
    expect(payload.originCity).toBe("CDMX");
    expect(payload.destinationCity).toBe("MTY");
    expect(payload.clientId).toBe(
      "33333333-3333-4333-8333-333333333333",
    );
    expect(payload.trailers).toBeUndefined();

    const snake = deepToSnake(payload) as {
      options?: { create_intent?: string };
    };
    expect(snake.options?.create_intent).toBe("reserve");

    const apiCheck = validateCreateTripApiPayload(payload);
    expect(apiCheck.ok).toBe(true);
  });

  it("includes trailers when assigned for Config S/R", () => {
    const trailerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const values = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      scheduledDeparture: "2030-01-15T14:00",
      scheduledArrival: "",
      startMileage: 12000,
      originCity: "CDMX",
      destinationCity: "MTY",
      notes: "",
      baseRate: 35000,
      cfdiDocumentIntent: "ingreso",
      originBranchId: "",
      satConfigAutotransporteCode: "T3S2",
      trailers: [{ trailerId, position: 1 as const }],
      stops: [],
      cargos: [],
      expenses: [],
      internalStaff: [],
    } as unknown as TripWizardFormValues;

    const payload = buildCreateTripInputFromWizardValues(values, undefined, {
      createIntent: "reserve",
    });

    expect(payload.trailers).toEqual([{ trailerId, position: 1 }]);
    expect(payload.satConfigAutotransporteCode).toBe("T3S2");

    const snake = deepToSnake(payload) as {
      trailers?: Array<{ trailer_id: string; position: number }>;
      sat_config_autotransporte_code?: string;
    };
    expect(snake.trailers?.[0]?.trailer_id).toBe(trailerId);
    expect(snake.sat_config_autotransporte_code).toBe("T3S2");

    const apiCheck = validateCreateTripApiPayload(payload);
    expect(apiCheck.ok).toBe(true);
  });

  it("emits allowExpiredDocs when reserved assignment has expired docs", () => {
    const values = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      scheduledDeparture: "2030-01-15T14:00",
      scheduledArrival: "",
      startMileage: 12000,
      originCity: "CDMX",
      destinationCity: "MTY",
      notes: "Canal: WhatsApp · Pedido verbal",
      baseRate: 35000,
      cfdiDocumentIntent: "ingreso",
      originBranchId: "",
      stops: [],
      cargos: [],
      expenses: [],
      internalStaff: [],
    } as unknown as TripWizardFormValues;

    const payload = buildCreateTripInputFromWizardValues(
      values,
      {
        vehicle: {
          insuranceExpiry: "2020-01-01",
          sctPermitExpiry: "2030-01-01",
        },
        driver: { isLicenseExpired: false },
      },
      { createIntent: "reserve" },
    );

    expect(payload.allowExpiredDocs).toBe(true);

    const snake = deepToSnake(payload) as {
      allow_expired_docs?: boolean;
      options?: { create_intent?: string };
    };
    expect(snake.allow_expired_docs).toBe(true);
    expect(snake.options?.create_intent).toBe("reserve");

    const apiCheck = validateCreateTripApiPayload(payload);
    expect(apiCheck.ok).toBe(true);
  });

  it("includes cloned stops when provided for canvas corridor clone", () => {
    const values = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      scheduledDeparture: "2030-01-15T14:00",
      scheduledArrival: "",
      startMileage: 12000,
      originCity: "CDMX",
      destinationCity: "MTY",
      notes: "",
      baseRate: 35000,
      cfdiDocumentIntent: "ingreso",
      originBranchId: "",
      stops: [],
      cargos: [],
      expenses: [],
      internalStaff: [],
    } as unknown as TripWizardFormValues;

    const clonedStops: CreateStopInput[] = [
      {
        sequenceOrder: 1,
        stopType: [StopType.ORIGIN],
        address: "CEDIS Norte",
        city: "CDMX",
        postalCode: "07700",
        satStateCode: "CMX",
        sourceAddressId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      },
      {
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        address: "Patio Norte",
        city: "MTY",
        postalCode: "64000",
        satStateCode: "NLE",
        sourceAddressId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      },
    ];

    const payload = buildCreateTripInputFromWizardValues(values, undefined, {
      createIntent: "reserve",
      clonedStops,
    });

    expect(payload.stops).toEqual(clonedStops);
    expect(payload.options).toEqual({ createIntent: "reserve" });

    const snake = deepToSnake(payload) as {
      options?: { create_intent?: string };
      stops?: Array<{ source_address_id?: string; sequence_order?: number }>;
    };
    expect(snake.options?.create_intent).toBe("reserve");
    expect(snake.stops?.[0]?.source_address_id).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(snake.stops?.[0]?.sequence_order).toBe(1);

    const apiCheck = validateCreateTripApiPayload(payload);
    expect(apiCheck.ok).toBe(true);
  });

  it("persists haversine km on cloned corridor stops with coordinates", () => {
    const values = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      scheduledDeparture: "2030-01-15T14:00",
      scheduledArrival: "",
      startMileage: 12000,
      originCity: "CDMX",
      destinationCity: "MTY",
      notes: "",
      baseRate: 35000,
      cfdiDocumentIntent: "ingreso",
      originBranchId: "",
      stops: [],
      cargos: [],
      expenses: [],
      internalStaff: [],
    } as unknown as TripWizardFormValues;

    const origin = { latitude: 19.357, longitude: -99.259 };
    const destination = { latitude: 20.784, longitude: -105.518 };
    const expectedKm = estimateRoadDistanceKm(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
    )!;
    const corridor: ClientCorridor = {
      corridorKey: "cdmx-mty",
      originCity: "CDMX",
      originState: "CMX",
      destinationCity: "MTY",
      destinationState: "NLE",
      stopCount: 2,
      tripCount: 4,
      lastUsedAt: "2026-08-10T18:00:00.000Z",
      sampleTripId: "trip-sample",
      stopsSnapshot: [
        {
          sequenceOrder: 1,
          stopType: [StopType.ORIGIN],
          address: "CEDIS Norte",
          city: "CDMX",
          postalCode: "07700",
          satStateCode: "CMX",
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        {
          sequenceOrder: 2,
          stopType: [StopType.DESTINATION],
          address: "Patio Norte",
          city: "MTY",
          postalCode: "64000",
          satStateCode: "NLE",
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      ],
    };

    const payload = buildCreateTripInputFromWizardValues(values, undefined, {
      createIntent: "reserve",
      clonedStops: replaceStopsFromCorridor(corridor),
    });

    expect(payload.stops?.[0]?.distanceFromPreviousKm).toBeUndefined();
    expect(payload.stops?.[1]?.distanceFromPreviousKm).toBe(expectedKm);
    expect(payload.stops?.[1]?.distanceSource).toBe("haversine_fallback");

    const apiCheck = validateCreateTripApiPayload(payload);
    expect(apiCheck.ok).toBe(true);
  });

  it("preserves startMileage 0 in the reserve payload", () => {
    const values = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      scheduledDeparture: "2030-01-15T14:00",
      scheduledArrival: "",
      startMileage: 0,
      originCity: "CDMX",
      destinationCity: "MTY",
      notes: "",
      baseRate: 35000,
      cfdiDocumentIntent: "ingreso",
      originBranchId: "",
      stops: [],
      cargos: [],
      expenses: [],
      internalStaff: [],
    } as unknown as TripWizardFormValues;

    const payload = buildCreateTripInputFromWizardValues(values, undefined, {
      createIntent: "reserve",
    });

    expect(payload.startMileage).toBe(0);
    const snake = deepToSnake(payload) as { start_mileage?: number };
    expect(snake.start_mileage).toBe(0);
  });

  it("omits startMileage from reserve payload when it was not captured", () => {
    const values = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      clientId: "33333333-3333-4333-8333-333333333333",
      scheduledDeparture: "2030-01-15T14:00",
      scheduledArrival: "",
      originCity: "CDMX",
      destinationCity: "MTY",
      notes: "",
      cfdiDocumentIntent: "ingreso",
      originBranchId: "",
      stops: [],
      cargos: [],
      expenses: [],
      internalStaff: [],
    } as unknown as TripWizardFormValues;

    const payload = buildCreateTripInputFromWizardValues(values, undefined, {
      createIntent: "reserve",
    });

    expect(payload.startMileage).toBeUndefined();
    const snake = deepToSnake(payload) as { start_mileage?: number };
    expect(snake.start_mileage).toBeUndefined();

    const apiCheck = validateCreateTripApiPayload(payload);
    expect(apiCheck.ok).toBe(true);
  });
});
