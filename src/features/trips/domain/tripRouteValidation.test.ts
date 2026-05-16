import { describe, expect, it } from "vitest";

import {
  validateCreateStopHasResolvableLocation,
  validateCreateTripRoute,
  validateStopsIncludeOriginAndDestination,
  validateTripEndpointSummary,
  validateTripRouteForScheduling,
} from "@features/trips/domain";
import type { Trip } from "@features/trips/domain";

describe("tripRouteValidation", () => {
  it("exige resumen de origen y destino", () => {
    expect(validateTripEndpointSummary("Guadalajara", "CDMX")).toBeNull();
    expect(validateTripEndpointSummary("", "CDMX")?.code).toBe(
      "ORIGIN_REQUIRED",
    );
    expect(validateTripEndpointSummary("Guadalajara", "")?.code).toBe(
      "DESTINATION_REQUIRED",
    );
  });

  it("exige paradas origin y destination cuando hay ruta detallada", () => {
    expect(
      validateStopsIncludeOriginAndDestination([
        { stopType: ["origin"] },
        { stopType: ["destination"] },
      ]),
    ).toBeNull();
    expect(
      validateStopsIncludeOriginAndDestination([{ stopType: ["pickup"] }])
        ?.code,
    ).toBe("MISSING_ORIGIN_STOP");
  });

  it("acepta parada con address_id unificado sin texto de calle", () => {
    expect(
      validateCreateStopHasResolvableLocation({
        address: "",
        addressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
        city: "",
      }),
    ).toBeNull();
  });

  it("valida create y schedule con el mismo criterio de resumen", () => {
    const input = {
      originCity: "Guadalajara",
      destinationCity: "CDMX",
      stops: [
        { stopType: ["origin"] as const },
        { stopType: ["destination"] as const },
      ],
    };

    expect(validateCreateTripRoute(input)).toBeNull();

    const trip = {
      originCity: "Guadalajara",
      destinationCity: "CDMX",
      stops: [
        { stopType: ["origin"] },
        { stopType: ["destination"] },
      ],
    } as Pick<Trip, "originCity" | "destinationCity" | "stops">;

    expect(validateTripRouteForScheduling(trip)).toBeNull();
  });
});
