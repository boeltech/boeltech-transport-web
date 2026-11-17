import { describe, expect, it } from "vitest";

import type { ComposerEndpointPick } from "../../components/trip-route/buildReplaceStopsPayload";
import {
  buildReserveStopsFromEndpointDraft,
  cityLabelFromLocationValue,
  cityOnlyLocationValue,
} from "./reserveEndpointLocation";

function putReadyPick(
  overrides: Partial<ComposerEndpointPick> = {},
): ComposerEndpointPick {
  return {
    id: "addr-1",
    ownerType: "client",
    ownerId: "client-1",
    ownerLabel: "Cliente",
    addressType: "shipping",
    locationName: "CEDIS Norte",
    street: "Av. Industrial",
    exteriorNumber: "100",
    postalCode: "64000",
    satStateCode: "NLE",
    satMunicipalityCode: "039",
    neighborhoodName: "Centro",
    satNeighborhoodCode: null,
    latitude: 25.68,
    longitude: -100.31,
    geocodingAccuracy: "exact",
    geolocationPending: false,
    isPrimary: false,
    isActive: true,
    isCartaPorteReady: true,
    ...overrides,
  };
}

describe("cityLabelFromLocationValue", () => {
  it("prefers localityName then locationName before comma", () => {
    expect(
      cityLabelFromLocationValue({
        locationName: "Monterrey, N.L., México",
        localityName: "Apodaca",
      }),
    ).toBe("Apodaca");
    expect(
      cityLabelFromLocationValue({
        locationName: "Monterrey, N.L., México",
      }),
    ).toBe("Monterrey");
  });

  it("returns empty for null", () => {
    expect(cityLabelFromLocationValue(null)).toBe("");
  });
});

describe("cityOnlyLocationValue", () => {
  it("builds a non-put-ready city card value", () => {
    expect(cityOnlyLocationValue("CDMX")).toEqual({ locationName: "CDMX" });
  });
});

describe("buildReserveStopsFromEndpointDraft", () => {
  it("omits stops when picks are city-only / not put-ready", () => {
    const cityOnly = putReadyPick({
      latitude: null,
      longitude: null,
      postalCode: "",
      satStateCode: "",
      street: "",
      locationName: "Monterrey",
    });
    expect(
      buildReserveStopsFromEndpointDraft({ origin: cityOnly }),
    ).toBeUndefined();
  });

  it("emits 1–2 put-ready stops for reserve", () => {
    const origin = putReadyPick({ id: "o-1", locationName: "Origen" });
    const destination = putReadyPick({
      id: "d-1",
      locationName: "Destino",
      postalCode: "06600",
      satStateCode: "CMX",
      latitude: 19.43,
      longitude: -99.13,
    });

    const one = buildReserveStopsFromEndpointDraft({ origin });
    expect(one).toHaveLength(1);
    expect(one?.[0]?.stopType).toEqual(
      expect.arrayContaining(["origin", "pickup"]),
    );

    const two = buildReserveStopsFromEndpointDraft({ origin, destination });
    expect(two).toHaveLength(2);
    expect(two?.[0]?.sequenceOrder).toBe(1);
    expect(two?.[1]?.sequenceOrder).toBe(2);
  });
});
