import { describe, expect, it } from "vitest";

import { StopType } from "@features/trips/domain";

import { buildStopMarkers } from "./trackingMapHelpers";

describe("buildStopMarkers", () => {
  it("F9h: label = Lugar; sublabel no repite city comercial contaminada", () => {
    const markers = buildStopMarkers([
      {
        id: "d1",
        sequenceOrder: 2,
        stopType: [StopType.DESTINATION],
        locationName: "Vórtice",
        city: "Nissan Aguascalientes",
        address: "Calle Industrial 10",
        street: "Calle Industrial",
        exteriorNumber: "10",
        latitude: 21.88,
        longitude: -102.29,
      } as never,
    ]);

    expect(markers).toHaveLength(1);
    expect(markers[0]?.label).toBe("Vórtice");
    expect(markers[0]?.sublabel).toMatch(/Calle Industrial/);
    expect(markers[0]?.sublabel).not.toMatch(/Nissan/i);
  });
});
