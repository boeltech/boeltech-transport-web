import { describe, expect, it } from "vitest";

import { StopType } from "@features/trips/domain";

import { formatTripRouteTitle } from "./formatTripRouteTitle";

describe("formatTripRouteTitle", () => {
  it("D1: une origen → escala → destino por locationName", () => {
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
    expect(title).toBe("Monterrey → Saltillo → Torreón");
  });

  it("fallback legacy origen → destino", () => {
    expect(
      formatTripRouteTitle([], {
        originCity: "Monterrey",
        destinationCity: "Torreón",
      }),
    ).toBe("Monterrey → Torreón");
  });

  it("D1/P2-4: prioriza ciudad sobre domicilio en locationName", () => {
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
