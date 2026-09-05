import { describe, expect, it } from "vitest";

import type { GeocodingCandidate } from "@shared/geolocation/contracts/geoPorts";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

import {
  composeLocationSearchResults,
  locationValueFromInternal,
  locationValueToAddressSearchListItem,
  LOCATION_CREATE_SENTINEL_ID,
} from "./locationSearchCompositor";

const internalBase: AddressSearchListItem = {
  id: "addr-1",
  ownerType: "client",
  ownerId: "client-aaa",
  ownerLabel: "Cliente A",
  addressType: "shipping",
  locationName: "Bodega A",
  street: "Calle 1",
  exteriorNumber: "10",
  postalCode: "44100",
  satStateCode: "JAL",
  satMunicipalityCode: "039",
  neighborhoodName: null,
  satNeighborhoodCode: null,
  latitude: 20.67,
  longitude: -103.35,
  geocodingAccuracy: "approximate",
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

const otherInternal: AddressSearchListItem = {
  ...internalBase,
  id: "addr-2",
  ownerType: "tenant",
  ownerId: "tenant-1",
  ownerLabel: "Mi empresa",
  locationName: "CEDIS",
};

const mapbox: GeocodingCandidate = {
  label: "Av López Mateos, Guadalajara, Jalisco",
  position: { latitude: 20.66, longitude: -103.39 },
  rawPlaceId: "mbx-1",
};

describe("composeLocationSearchResults", () => {
  it("orders client-prioritized internals before other internals, then mapbox, then create", () => {
    const results = composeLocationSearchResults({
      internal: [otherInternal, internalBase],
      mapbox: [mapbox],
      clientId: "client-aaa",
    });

    expect(results.map((r) => r.source)).toEqual([
      "internal",
      "internal",
      "mapbox",
      "create",
    ]);
    expect(results[0]?.internal?.id).toBe("addr-1");
    expect(results[1]?.internal?.id).toBe("addr-2");
    expect(results[2]?.mapbox?.rawPlaceId).toBe("mbx-1");
    expect(results[3]?.id).toBe(LOCATION_CREATE_SENTINEL_ID);
  });

  it("elevates create before mapbox when searchConfidence is low", () => {
    const results = composeLocationSearchResults({
      internal: [internalBase],
      mapbox: [mapbox],
      searchConfidence: "low",
    });

    expect(results.map((r) => r.source)).toEqual([
      "internal",
      "create",
      "mapbox",
    ]);
    expect(results[1]?.label).toContain("mapa");
  });

  it("can omit create sentinel", () => {
    const results = composeLocationSearchResults({
      internal: [],
      mapbox: [],
      includeCreate: false,
    });
    expect(results).toHaveLength(0);
  });

  it("omits catalog hits when includeInternal is false", () => {
    const results = composeLocationSearchResults({
      internal: [internalBase, otherInternal],
      mapbox: [mapbox],
      includeInternal: false,
    });

    expect(results.map((r) => r.source)).toEqual(["mapbox", "create"]);
    expect(results.every((r) => r.source !== "internal")).toBe(true);
  });

  it("keeps D3 catalog-first order when includeInternal is true (default)", () => {
    const results = composeLocationSearchResults({
      internal: [internalBase],
      mapbox: [mapbox],
    });

    expect(results.map((r) => r.source)).toEqual([
      "internal",
      "mapbox",
      "create",
    ]);
  });
});

describe("locationValueFromInternal / locationValueToAddressSearchListItem", () => {
  it("round-trips catalog metadata", () => {
    const value = locationValueFromInternal({
      ...internalBase,
      remitenteRfc: "AAA010101AAA",
      remitenteName: "Cliente A",
      isPrimary: true,
    });

    expect(value.sourceOwnerType).toBe("client");
    expect(value.sourceOwnerId).toBe("client-aaa");
    expect(value.remitenteRfc).toBe("AAA010101AAA");

    const back = locationValueToAddressSearchListItem(value);
    expect(back).toEqual(
      expect.objectContaining({
        id: "addr-1",
        ownerType: "client",
        ownerId: "client-aaa",
        locationName: "Bodega A",
        remitenteRfc: "AAA010101AAA",
        isPrimary: true,
      }),
    );
  });

  it("returns null without catalog source ids", () => {
    expect(
      locationValueToAddressSearchListItem({
        locationName: "Mapa",
        latitude: 20,
        longitude: -103,
      }),
    ).toBeNull();
  });
});
