import { describe, expect, it } from "vitest";

import type { AddressType } from "../../domain";
import {
  clientAddressAlertFlags,
  groupClientAddressesByPurpose,
  isClientFiscalAddressType,
  isClientTripAddressType,
  showsClientUbicacionFields,
} from "./clientAddressPurpose";

function item(addressType: AddressType, postalCode?: string) {
  return { addressType, postalCode };
}

describe("clientAddressPurpose", () => {
  it("treats billing as fiscal and not a trip place", () => {
    expect(isClientFiscalAddressType("billing")).toBe(true);
    expect(isClientTripAddressType("billing")).toBe(false);
    expect(showsClientUbicacionFields("billing")).toBe(false);
  });

  it("shows Ubicación RFC/geo only on shipping, pickup and warehouse", () => {
    expect(showsClientUbicacionFields("shipping")).toBe(true);
    expect(showsClientUbicacionFields("pickup")).toBe(true);
    expect(showsClientUbicacionFields("warehouse")).toBe(true);
    expect(showsClientUbicacionFields("office")).toBe(false);
    expect(showsClientUbicacionFields("other")).toBe(false);
  });

  it("groups fiscal vs trip vs directory-only", () => {
    const grouped = groupClientAddressesByPurpose([
      item("billing"),
      item("warehouse"),
      item("office"),
      item("shipping"),
      item("other"),
    ]);
    expect(grouped.fiscal.map((a) => a.addressType)).toEqual(["billing"]);
    expect(grouped.forTrips.map((a) => a.addressType)).toEqual([
      "warehouse",
      "shipping",
    ]);
    expect(grouped.other.map((a) => a.addressType)).toEqual(["office", "other"]);
  });

  it("flags missing billing CP independently of trip places", () => {
    expect(clientAddressAlertFlags([])).toEqual({
      missingBillingCp: true,
      noTripPlaces: true,
    });
    expect(
      clientAddressAlertFlags([item("billing", "44100")]),
    ).toEqual({
      missingBillingCp: false,
      noTripPlaces: true,
    });
    expect(clientAddressAlertFlags([item("warehouse", "64000")])).toEqual({
      missingBillingCp: true,
      noTripPlaces: false,
    });
    expect(
      clientAddressAlertFlags([
        item("billing", ""),
        item("shipping", "44100"),
      ]),
    ).toEqual({
      missingBillingCp: true,
      noTripPlaces: false,
    });
  });
});
