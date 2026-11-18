import { describe, expect, it } from "vitest";

import type { GeocodingCandidate } from "@shared/geolocation/contracts/geoPorts";

import {
  cityLabelFromMapboxCandidate,
  cityOnlyLocationValueFromMapbox,
  isCityOnlyLocationValue,
  isMapboxCityCandidate,
} from "./isMapboxCityCandidate";

function candidate(
  overrides: Partial<GeocodingCandidate> = {},
): GeocodingCandidate {
  return {
    label: "Torreón, Coahuila, Mexico",
    position: { latitude: 25.54, longitude: -103.44 },
    featureTypes: ["place"],
    place: "Torreón",
    region: "Coahuila",
    ...overrides,
  };
}

describe("isMapboxCityCandidate", () => {
  it("accepts place / region / locality without address or poi", () => {
    expect(isMapboxCityCandidate(candidate({ featureTypes: ["place"] }))).toBe(
      true,
    );
    expect(isMapboxCityCandidate(candidate({ featureTypes: ["region"] }))).toBe(
      true,
    );
    expect(
      isMapboxCityCandidate(candidate({ featureTypes: ["locality"] })),
    ).toBe(true);
  });

  it("rejects address / poi even if place is listed", () => {
    expect(
      isMapboxCityCandidate(
        candidate({ featureTypes: ["address", "place"] }),
      ),
    ).toBe(false);
    expect(
      isMapboxCityCandidate(candidate({ featureTypes: ["poi"] })),
    ).toBe(false);
  });

  it("rejects missing featureTypes (prefer Sheet over silent city)", () => {
    expect(
      isMapboxCityCandidate(candidate({ featureTypes: undefined })),
    ).toBe(false);
    expect(isMapboxCityCandidate(candidate({ featureTypes: [] }))).toBe(false);
  });
});

describe("cityOnlyLocationValueFromMapbox", () => {
  it("builds city label from place + region", () => {
    expect(cityLabelFromMapboxCandidate(candidate())).toBe(
      "Torreón, Coahuila",
    );
    expect(cityOnlyLocationValueFromMapbox(candidate())).toEqual({
      locationName: "Torreón, Coahuila",
      localityName: "Torreón",
    });
  });
});

describe("isCityOnlyLocationValue", () => {
  it("detects name-only values", () => {
    expect(
      isCityOnlyLocationValue({ locationName: "Monterrey, N.L." }),
    ).toBe(true);
  });

  it("rejects place-like evidence", () => {
    expect(
      isCityOnlyLocationValue({
        locationName: "Bodega",
        postalCode: "64000",
        latitude: 25.6,
        longitude: -100.3,
      }),
    ).toBe(false);
    expect(
      isCityOnlyLocationValue({
        locationName: "Bodega",
        sourceAddressId: "addr-1",
      }),
    ).toBe(false);
  });
});
