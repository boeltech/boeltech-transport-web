import { describe, expect, it } from "vitest";

import {
  formatRouteStopPlaceLabel,
  resolveRouteStopPlaceLabel,
} from "./routeStopPlaceLabel";

describe("routeStopPlaceLabel", () => {
  it("prioriza locationName sobre city", () => {
    expect(
      resolveRouteStopPlaceLabel({
        sequenceOrder: 1,
        locationName: "Vórtice",
        city: "Nissan Aguascalientes",
        address: "Calle 1",
      }),
    ).toBe("Vórtice");
  });

  it("usa city cuando locationName es calle", () => {
    expect(
      resolveRouteStopPlaceLabel({
        sequenceOrder: 1,
        locationName: "Av. Reforma #100",
        city: "CDMX",
        address: null as unknown as string,
      }),
    ).toBe("CDMX");
  });

  it("omite códigos SAT bare en city", () => {
    expect(
      resolveRouteStopPlaceLabel({
        sequenceOrder: 2,
        locationName: null,
        city: "039",
        address: "Bodega centro",
      }),
    ).toBe("Bodega centro");
  });

  it("fallback Parada N", () => {
    expect(
      formatRouteStopPlaceLabel({
        sequenceOrder: 3,
        locationName: null,
        city: "",
        address: "",
      }),
    ).toBe("Parada 3");
  });
});
