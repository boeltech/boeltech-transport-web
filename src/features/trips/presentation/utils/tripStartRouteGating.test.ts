import { describe, expect, it } from "vitest";

import { StopType, TripStatus } from "@features/trips/domain";

import {
  isTripRouteReadyForStartUi,
  tripStartRouteBlockReason,
} from "./tripStartRouteGating";

describe("tripStartRouteGating", () => {
  it("treats empty stops as not ready", () => {
    expect(isTripRouteReadyForStartUi([])).toBe(false);
  });

  it("accepts origin and destination", () => {
    expect(
      isTripRouteReadyForStartUi([
        { stopType: [StopType.ORIGIN] },
        { stopType: [StopType.DESTINATION] },
      ]),
    ).toBe(true);
  });

  it("returns package reason when scheduled without route", () => {
    expect(tripStartRouteBlockReason(TripStatus.SCHEDULED, [])).toBe(
      "Se requieren paradas de origen y destino para iniciar el viaje.",
    );
  });

  it("does not block start when origin and destination exist", () => {
    expect(
      tripStartRouteBlockReason(TripStatus.SCHEDULED, [
        { stopType: [StopType.ORIGIN] },
        { stopType: [StopType.DESTINATION] },
      ]),
    ).toBeNull();
  });
});
