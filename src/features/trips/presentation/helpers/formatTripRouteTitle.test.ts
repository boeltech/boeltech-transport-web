import { describe, expect, it } from "vitest";

import { StopType } from "@features/trips/domain";

import { formatTripRouteTitle } from "./formatTripRouteTitle";

describe("formatTripRouteTitle", () => {
  it("RP-2 / F11 B: solo extremos ciudad-only; escalas no entran al H1", () => {
    const title = formatTripRouteTitle(
      [
        {
          id: "1",
          sequenceOrder: 1,
          stopType: StopType.ORIGIN,
          city: "Monterrey",
          locationName: "CEDIS Norte",
        },
        {
          id: "2",
          sequenceOrder: 2,
          stopType: StopType.WAYPOINT,
          city: "Saltillo",
          locationName: "Bodega Saltillo",
        },
        {
          id: "3",
          sequenceOrder: 3,
          stopType: StopType.DESTINATION,
          city: "Torreón",
          locationName: "Andén 4",
        },
      ] as never,
      {},
    );
    expect(title).toBe("Monterrey → Torreón");
    expect(title).not.toMatch(/Saltillo|CEDIS|Andén/i);
  });

  it("RP-2: no usa locationName (F9h) en el H1", () => {
    const title = formatTripRouteTitle(
      [
        {
          id: "1",
          sequenceOrder: 1,
          stopType: StopType.ORIGIN,
          locationName: "CEDIS Norte",
          city: "Guadalajara",
        },
        {
          id: "2",
          sequenceOrder: 2,
          stopType: StopType.DESTINATION,
          locationName: "Vórtice",
          city: "Aguascalientes",
        },
      ] as never,
      {},
    );
    expect(title).toBe("Guadalajara → Aguascalientes");
    expect(title).not.toMatch(/CEDIS|Vórtice/i);
  });

  it("fallback legacy origen → destino (ciudad)", () => {
    expect(
      formatTripRouteTitle([], {
        originCity: "Monterrey",
        destinationCity: "Torreón",
      }),
    ).toBe("Monterrey → Torreón");
  });

  it("no usa domicilio en locationName; cae a city", () => {
    const title = formatTripRouteTitle(
      [
        {
          id: "1",
          sequenceOrder: 1,
          stopType: StopType.ORIGIN,
          locationName: "Av. Vasconcelos #1200, San Pedro",
          city: "Monterrey",
          state: "NL",
        },
        {
          id: "2",
          sequenceOrder: 2,
          stopType: StopType.DESTINATION,
          locationName: "Calle Industria 45",
          city: "Torreón",
          state: "COAH",
        },
      ] as never,
      {},
    );
    expect(title).toBe("Monterrey → Torreón");
    expect(title).not.toMatch(/Vasconcelos|Industria/i);
  });
});
