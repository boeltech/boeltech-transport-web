import { describe, expect, it } from "vitest";

import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

import {
  isAllowedRoutePickerItem,
  ownerTypesForRouteSlot,
  ROUTE_CLIENT_ADDRESS_TYPES,
  ROUTE_ORIGIN_OWNER_TYPES,
  ROUTE_STOP_OWNER_TYPES,
} from "./routeAddressPickerOwnerTypes";

function item(
  overrides: Partial<AddressSearchListItem> &
    Pick<AddressSearchListItem, "ownerType" | "addressType">,
): AddressSearchListItem {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    ownerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    ownerLabel: "Cliente",
    locationName: "Lugar",
    street: "Calle",
    exteriorNumber: "1",
    postalCode: "44100",
    satStateCode: "JAL",
    satMunicipalityCode: "039",
    neighborhoodName: null,
    satNeighborhoodCode: null,
    latitude: null,
    longitude: null,
    geolocationPending: false,
    isPrimary: false,
    isActive: true,
    isCartaPorteReady: true,
    ...overrides,
  };
}

describe("ownerTypesForRouteSlot", () => {
  it("includes branch and tenant on origin", () => {
    expect(ownerTypesForRouteSlot("origin")).toEqual([
      "client",
      "branch",
      "tenant",
    ]);
    expect(ROUTE_ORIGIN_OWNER_TYPES).toContain("branch");
    expect(ROUTE_ORIGIN_OWNER_TYPES).toContain("tenant");
  });

  it("omits branch on destination and waypoint; keeps tenant", () => {
    expect(ownerTypesForRouteSlot("destination")).toEqual(["client", "tenant"]);
    expect(ownerTypesForRouteSlot("waypoint")).toEqual(["client", "tenant"]);
    expect(ROUTE_STOP_OWNER_TYPES).not.toContain("branch");
  });

  it("keeps client shipping, pickup and warehouse; drops billing, office and other", () => {
    expect(ROUTE_CLIENT_ADDRESS_TYPES).toEqual([
      "shipping",
      "pickup",
      "warehouse",
    ]);
    expect(
      isAllowedRoutePickerItem(
        item({ ownerType: "client", addressType: "shipping" }),
      ),
    ).toBe(true);
    expect(
      isAllowedRoutePickerItem(
        item({ ownerType: "client", addressType: "billing" }),
      ),
    ).toBe(false);
    expect(
      isAllowedRoutePickerItem(
        item({ ownerType: "client", addressType: "office" }),
      ),
    ).toBe(false);
    expect(
      isAllowedRoutePickerItem(
        item({ ownerType: "client", addressType: "other" }),
      ),
    ).toBe(false);
  });

  it("does not filter branch or tenant items by address type", () => {
    expect(
      isAllowedRoutePickerItem(
        item({ ownerType: "tenant", addressType: "billing" }),
      ),
    ).toBe(true);
    expect(
      isAllowedRoutePickerItem(
        item({ ownerType: "branch", addressType: "branch" }),
      ),
    ).toBe(true);
  });
});
