import { describe, expect, it } from "vitest";

import { StopType } from "@features/trips/domain";

import { formatTripRouteTitle } from "./formatTripRouteTitle";

describe("formatTripRouteTitle", () => {
  it("F9h/D-F9h-14: solo extremos; escalas no entran al H1", () => {
    const title = formatTripRouteTitle(
      [
        {
          id: "1",
          sequenceOrder: 1,
          stopType: StopType.ORIGIN,
          locationName: "Monterrey",
        },
        {
          id: "2",
          sequenceOrder: 2,
          stopType: StopType.WAYPOINT,
          locationName: "Saltillo",
        },
        {
          id: "3",
          sequenceOrder: 3,
          stopType: StopType.DESTINATION,
          locationName: "Torreón",
        },
      ] as never,
      {},
    );
    expect(title).toBe("Monterrey → Torreón");
    expect(title).not.toMatch(/Saltillo/);
  });

  it("F9h: Lugar prioriza locationName sobre city contaminada", () => {
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
          city: "Nissan Aguascalientes",
        },
      ] as never,
      {},
    );
    expect(title).toBe("CEDIS Norte → Vórtice");
    expect(title).not.toMatch(/Nissan/i);
  });

  it("fallback legacy origen → destino", () => {
    expect(
      formatTripRouteTitle([], {
        originCity: "Monterrey",
        destinationCity: "Torreón",
      }),
    ).toBe("Monterrey → Torreón");
  });

  it("D1/P2-4: no usa domicilio en locationName como Lugar", () => {
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
