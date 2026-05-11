/**
 * WS-G2 — Contrato: mismo payload cliente (camelCase → snake_case) misma decisión que Zod del paquete.
 */
import { describe, expect, it } from "vitest";
import { createTripSchema } from "@boeltech/cfdi-domain/validadores/trips";
import { deepToCamel, deepToSnake } from "@shared/api/utils/case-transformer";

import type { CreateTripInput } from "@features/trips/domain";
import { validateCreateTripApiPayload } from "./validateTripApiPayload";

/** Fixture snake_case alineado con `test/trips-validation.test.ts` del paquete (parse exitoso). */
const VALID_CREATE_TRIP_SNAKE = {
  vehicle_id: "11111111-1111-4111-8111-111111111111",
  driver_id: "22222222-2222-4222-8222-222222222222",
  scheduled_departure: "2026-05-10T12:00:00.000Z",
  origin_city: "Guadalajara",
  destination_city: "CDMX",
  stops: [
    {
      sequence_order: 0,
      stop_type: "origin",
      address: "Calle Falsa 123",
      city: "Guadalajara",
      postal_code: "44100",
      sat_state_code: "JAL",
      sat_municipality_code: "039",
    },
  ],
  estimated_expenses: [
    {
      category: "fuel",
      description: "Gasolina",
      amount: 500,
    },
  ],
  internal_staff: [
    {
      employee_id: "33333333-3333-4333-8333-333333333333",
      internal_role: "helper",
    },
  ],
};

describe("Trip API payload contract (create)", () => {
  it("validateCreateTripApiPayload matches createTripSchema.safeParse after deepToSnake", () => {
    const camel = deepToCamel(
      VALID_CREATE_TRIP_SNAKE,
    ) as unknown as CreateTripInput;
    const roundTripSnake = deepToSnake(camel);

    const viaWrapper = validateCreateTripApiPayload(camel);
    const direct = createTripSchema.safeParse(roundTripSnake);

    expect(viaWrapper.ok).toBe(direct.success);
    if (viaWrapper.ok && direct.success) {
      expect(viaWrapper.ok).toBe(true);
    }
  });

  it("reject empty body: wrapper and schema agree", () => {
    const viaWrapper = validateCreateTripApiPayload({} as CreateTripInput);
    const direct = createTripSchema.safeParse(deepToSnake({}));
    expect(viaWrapper.ok).toBe(direct.success);
    expect(viaWrapper.ok).toBe(false);
  });
});
