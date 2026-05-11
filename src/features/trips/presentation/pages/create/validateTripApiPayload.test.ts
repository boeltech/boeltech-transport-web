import { describe, expect, it } from "vitest";

import type { CreateTripInput, UpdateTripInput } from "@features/trips/domain";

import {
  summarizeTripApiPayloadErrors,
  validateCreateTripApiPayload,
  validateUpdateTripApiPayload,
} from "./validateTripApiPayload";

describe("validateCreateTripApiPayload", () => {
  it("acepta un payload mínimo alineado con POST /trips", () => {
    const input: CreateTripInput = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      scheduledDeparture: "2026-05-10T12:00:00.000Z",
      originAddress: "X",
      originCity: "Guadalajara",
      destinationAddress: "Y",
      destinationCity: "CDMX",
      stops: [
        {
          sequenceOrder: 0,
          stopType: ["origin"],
          address: "Calle Falsa 123",
          city: "Guadalajara",
          postalCode: "44100",
          satStateCode: "JAL",
          satMunicipalityCode: "039",
        },
      ],
      internalStaff: [
        {
          employeeId: "33333333-3333-4333-8333-333333333333",
          internalRole: "helper",
        },
      ],
    };

    expect(validateCreateTripApiPayload(input)).toEqual({ ok: true });
  });

  it("rechaza internal_staff sin rol (contrato API)", () => {
    const input: CreateTripInput = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      scheduledDeparture: "2026-05-10T12:00:00.000Z",
      originAddress: "X",
      originCity: "Guadalajara",
      destinationAddress: "Y",
      destinationCity: "CDMX",
      internalStaff: [
        {
          employeeId: "33333333-3333-4333-8333-333333333333",
        },
      ],
    };

    const result = validateCreateTripApiPayload(input);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors).length).toBeGreaterThan(0);
    expect(summarizeTripApiPayloadErrors(result.fieldErrors)).toContain(
      "internal_staff",
    );
  });
});

describe("validateUpdateTripApiPayload", () => {
  it("valida paradas y cargas cuando updateTripSchema los incluye", () => {
    const input: UpdateTripInput = {
      originCity: "Guadalajara",
      destinationCity: "CDMX",
      stops: [
        {
          sequenceOrder: 0,
          stopType: ["origin"],
          address: "Calle Falsa 123",
          city: "Guadalajara",
          postalCode: "44100",
          satStateCode: "JAL",
          satMunicipalityCode: "039",
        },
      ],
      cargos: [
        {
          clientId: "44444444-4444-4444-8444-444444444444",
          description: "Caja",
        },
      ],
    };

    expect(validateUpdateTripApiPayload(input)).toEqual({ ok: true });
  });
});
