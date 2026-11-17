import { describe, expect, it } from "vitest";

import { resolveRouteSearchProximity } from "./resolveRouteSearchProximity";

describe("resolveRouteSearchProximity", () => {
  it("biases destination search toward origin coords (Q16)", () => {
    expect(
      resolveRouteSearchProximity({
        category: "destination",
        originPick: {
          id: "a",
          locationName: "A",
          latitude: 19,
          longitude: -99,
        } as never,
      }),
    ).toEqual({ latitude: 19, longitude: -99 });
  });

  it("uses midpoint for waypoint when both ends exist", () => {
    expect(
      resolveRouteSearchProximity({
        category: "waypoint",
        originPick: {
          id: "a",
          locationName: "A",
          latitude: 20,
          longitude: -100,
        } as never,
        destinationPick: {
          id: "b",
          locationName: "B",
          latitude: 22,
          longitude: -102,
        } as never,
      }),
    ).toEqual({ latitude: 21, longitude: -101 });
  });
});
