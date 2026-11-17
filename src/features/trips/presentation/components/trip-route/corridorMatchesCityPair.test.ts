import { describe, expect, it } from "vitest";

import type { ClientCorridor } from "@features/trips/domain";

import {
  corridorMatchesCityPair,
  filterCorridorsMatchingCityPair,
} from "./corridorMatchesCityPair";

function corridor(
  overrides: Partial<ClientCorridor> &
    Pick<ClientCorridor, "originCity" | "destinationCity">,
): ClientCorridor {
  return {
    corridorKey: "k1",
    originState: "CDMX",
    destinationState: "NL",
    stopCount: 2,
    tripCount: 1,
    lastUsedAt: "2026-01-01T00:00:00.000Z",
    sampleTripId: "trip-1",
    stopsSnapshot: [],
    ...overrides,
  };
}

describe("corridorMatchesCityPair", () => {
  it("matches normalized city pair (D57)", () => {
    expect(
      corridorMatchesCityPair(
        corridor({ originCity: "CDMX", destinationCity: "Monterrey" }),
        "cdmx",
        " Monterrey ",
      ),
    ).toBe(true);
  });

  it("rejects when a city is missing", () => {
    expect(
      corridorMatchesCityPair(
        corridor({ originCity: "CDMX", destinationCity: "MTY" }),
        "CDMX",
        "",
      ),
    ).toBe(false);
  });

  it("filters list to matching pair only", () => {
    const list = [
      corridor({
        corridorKey: "a",
        originCity: "CDMX",
        destinationCity: "MTY",
      }),
      corridor({
        corridorKey: "b",
        originCity: "CDMX",
        destinationCity: "GDL",
      }),
    ];
    expect(filterCorridorsMatchingCityPair(list, "CDMX", "MTY")).toHaveLength(
      1,
    );
    expect(filterCorridorsMatchingCityPair(list, "CDMX", "MTY")[0]?.corridorKey).toBe(
      "a",
    );
  });
});
