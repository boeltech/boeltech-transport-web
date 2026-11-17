import { describe, expect, it } from "vitest";

import { StopType, type TripStop } from "@features/trips/domain";

import { resolveDraftRouteGap } from "./resolveDraftRouteGap";

function stop(partial: Partial<TripStop> & Pick<TripStop, "id" | "stopType">): TripStop {
  return {
    sequenceOrder: 1,
    status: "pending",
    city: "CDMX",
    locationName: "Lugar",
    postalCode: "01000",
    satCountryCode: "MEX",
    satEstadoCode: "09",
    latitude: 19.4,
    longitude: -99.1,
    ...partial,
  } as TripStop;
}

describe("resolveDraftRouteGap", () => {
  it("returns route when both ends missing", () => {
    expect(resolveDraftRouteGap([])).toBe("route");
  });

  it("returns destination when only origin exists", () => {
    expect(
      resolveDraftRouteGap([
        stop({ id: "o", stopType: [StopType.ORIGIN, StopType.PICKUP], sequenceOrder: 1 }),
      ]),
    ).toBe("destination");
  });

  it("returns origin when only destination exists", () => {
    expect(
      resolveDraftRouteGap([
        stop({ id: "d", stopType: [StopType.DESTINATION, StopType.DELIVERY], sequenceOrder: 1 }),
      ]),
    ).toBe("origin");
  });

  it("returns domicilio when ends exist but incomplete", () => {
    expect(
      resolveDraftRouteGap([
        stop({
          id: "o",
          stopType: [StopType.ORIGIN, StopType.PICKUP],
          sequenceOrder: 1,
          postalCode: undefined,
          latitude: null,
          longitude: null,
        }),
        stop({
          id: "d",
          stopType: [StopType.DESTINATION, StopType.DELIVERY],
          sequenceOrder: 2,
        }),
      ]),
    ).toBe("domicilio");
  });

  it("returns null when both ends are complete", () => {
    expect(
      resolveDraftRouteGap([
        stop({ id: "o", stopType: [StopType.ORIGIN, StopType.PICKUP], sequenceOrder: 1 }),
        stop({
          id: "d",
          stopType: [StopType.DESTINATION, StopType.DELIVERY],
          sequenceOrder: 2,
        }),
      ]),
    ).toBeNull();
  });
});
