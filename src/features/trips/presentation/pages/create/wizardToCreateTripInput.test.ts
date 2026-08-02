import { describe, expect, it } from "vitest";

import { deepToSnake } from "@shared/api/utils/case-transformer";
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
    } as TripWizardFormValues;

    const payload = buildCreateTripInputFromWizardValues(values, undefined, {
      createIntent: "reserve",
    });

    expect(payload.stops).toBeUndefined();
    expect(payload.cargos).toBeUndefined();
    expect(payload.estimatedExpenses).toBeUndefined();
    expect(payload.options).toEqual({ createIntent: "reserve" });
    expect(payload.originCity).toBe("CDMX");
    expect(payload.destinationCity).toBe("MTY");
    expect(payload.clientId).toBe(
      "33333333-3333-4333-8333-333333333333",
    );

    const snake = deepToSnake(payload) as {
      options?: { create_intent?: string };
    };
    expect(snake.options?.create_intent).toBe("reserve");

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
    } as TripWizardFormValues;

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
});
