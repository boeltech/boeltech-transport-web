import { describe, expect, it } from "vitest";
import { toAddressSnapshot } from "./addressSnapshot";
import type { AddressSearchListItem } from "./types";

const baseItem: AddressSearchListItem = {
  id: "source-id-should-not-appear",
  ownerType: "tenant",
  ownerId: "owner-id-should-not-appear",
  ownerLabel: "Partner SA",
  addressType: "warehouse",
  locationName: "Bodega Norte",
  street: "Av Industria",
  exteriorNumber: "10",
  postalCode: "66600",
  satStateCode: "19",
  satMunicipalityCode: "006",
  neighborhoodName: "Parque",
  satNeighborhoodCode: "0001",
  latitude: 25.5,
  longitude: -100.2,
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

describe("toAddressSnapshot", () => {
  it("copies SAT/geo fields without source id or owner", () => {
    const snapshot = toAddressSnapshot(baseItem);

    expect(snapshot).toMatchObject({
      locationName: "Bodega Norte",
      satCountryCode: "MEX",
      satStateCode: "19",
      satMunicipalityCode: "006",
      postalCode: "66600",
      street: "Av Industria",
      exteriorNumber: "10",
      latitude: 25.5,
      longitude: -100.2,
      addressType: "warehouse",
    });
    expect(snapshot).not.toHaveProperty("id");
    expect(snapshot).not.toHaveProperty("ownerType");
    expect(snapshot).not.toHaveProperty("ownerId");
  });

  it("normalizes short SAT codes from hyphenated values", () => {
    const snapshot = toAddressSnapshot({
      ...baseItem,
      satMunicipalityCode: "MEX-19-006",
      satNeighborhoodCode: "COL-0001",
    });

    expect(snapshot.satMunicipalityCode).toBe("006");
    expect(snapshot.satNeighborhoodCode).toBe("0001");
  });
});
