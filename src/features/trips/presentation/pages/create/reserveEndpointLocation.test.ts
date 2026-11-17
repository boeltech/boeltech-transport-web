import { describe, expect, it } from "vitest";

import type { ComposerEndpointPick } from "../../components/trip-route/buildReplaceStopsPayload";
import {
  buildReserveStopsFromEndpointDraft,
  cityLabelFromLocationValue,
  cityOnlyLocationValue,
  isPlaceLikeLocationValue,
  placeIncompleteForReserveMessage,
  reserveCityLabelForForm,
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
  it("prefers localityName over commercial locationName", () => {
    expect(
      cityLabelFromLocationValue({
        locationName: "Bambú Coffee",
        localityName: "Apodaca",
        postalCode: "66600",
        latitude: 25.78,
        longitude: -100.24,
      }),
    ).toBe("Apodaca");
  });

  it("does not use commercial locationName for place-like values", () => {
    expect(
      cityLabelFromLocationValue({
        locationName: "Amazón México",
        postalCode: "06600",
        latitude: 19.43,
        longitude: -99.13,
        geocodingAccuracy: "manual",
      }),
    ).toBe("");
  });

  it("uses locationName for city-only (not place-like)", () => {
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

describe("reserveCityLabelForForm", () => {
  it("falls back to satStateCode when put-ready lacks locality", () => {
    expect(
      reserveCityLabelForForm(
        {
          locationName: "CEDIS Norte",
          postalCode: "64000",
          satStateCode: "NLE",
          latitude: 25.68,
          longitude: -100.31,
        },
        true,
      ),
    ).toBe("NLE");
  });
});

describe("isPlaceLikeLocationValue / placeIncompleteForReserveMessage", () => {
  it("treats coords+CP as place-like", () => {
    expect(
      isPlaceLikeLocationValue({
        locationName: "Bambú Coffee",
        postalCode: "76127",
        latitude: 20.59,
        longitude: -100.39,
      }),
    ).toBe(true);
  });

  it("returns message when place-like lacks satStateCode", () => {
    const message = placeIncompleteForReserveMessage({
      locationName: "Bambú Coffee",
      postalCode: "76127",
      street: "Av. Central",
      latitude: 20.59,
      longitude: -100.39,
      geocodingAccuracy: "manual",
    });
    expect(message).toMatch(/estado SAT/i);
  });

  it("returns null for put-ready place", () => {
    expect(
      placeIncompleteForReserveMessage({
        locationName: "CEDIS Norte",
        street: "Av. Industrial",
        postalCode: "64000",
        satStateCode: "NLE",
        latitude: 25.68,
        longitude: -100.31,
      }),
    ).toBeNull();
  });

  it("returns null for city-only", () => {
    expect(
      placeIncompleteForReserveMessage({ locationName: "Monterrey" }),
    ).toBeNull();
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
