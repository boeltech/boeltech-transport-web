import { describe, expect, it } from "vitest";

import type {
  CreateTripInput,
  UpdateTripInput,
  UpdateTripStatusInput,
} from "@features/trips/domain";

import {
  apiValidationPathToFormPath,
  formatTripApiValidationForUser,
  summarizeTripApiPayloadErrors,
  validateCreateTripApiPayload,
  validateTripQueryApiPayload,
  validateUpdateTripApiPayload,
  validateUpdateTripStatusApiPayload,
} from "./validateTripApiPayload";

describe("validateCreateTripApiPayload", () => {
  it("acepta un payload mínimo alineado con POST /trips", () => {
    const input: CreateTripInput = {
      vehicleId: "11111111-1111-4111-8111-111111111111",
      driverId: "22222222-2222-4222-8222-222222222222",
      scheduledDeparture: "2026-05-10T12:00:00.000Z",
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
      originCity: "Guadalajara",
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

describe("formatTripApiValidationForUser", () => {
  it("traduce errores típicos de internal_staff y stops.city", () => {
    const msg = formatTripApiValidationForUser(
      {
        "internal_staff.0.internal_role": "Invalid option",
        "stops.0.city": "Too small",
      },
      4,
    );
    expect(msg).toContain("personal de apoyo");
    expect(msg).toContain("ciudad");
    expect(msg).not.toContain("internal_staff.0");
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

describe("validateUpdateTripStatusApiPayload", () => {
  it("acepta status transitions payload válidos", () => {
    const input: UpdateTripStatusInput = { status: "in_progress" };
    expect(validateUpdateTripStatusApiPayload(input)).toEqual({ ok: true });
  });
});

describe("validateTripQueryApiPayload", () => {
  it("valida query params en snake_case", () => {
    expect(
      validateTripQueryApiPayload({
        page: 1,
        limit: 20,
        status: ["draft", "scheduled"],
        sort_by: "scheduled_departure",
        sort_order: "desc",
      }),
    ).toEqual({ ok: true });
  });
});

describe("apiValidationPathToFormPath", () => {
  it("convierte paths snake_case/numericos a camelCase", () => {
    expect(apiValidationPathToFormPath("internal_staff.0.employee_id")).toEqual([
      "internalStaff",
      0,
      "employeeId",
    ]);
  });
});
