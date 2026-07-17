import { describe, expect, it } from "vitest";
import type { BranchAddress } from "@features/branches";
import { mapBranchAddressToOriginStopSlice } from "./branchAddressToOriginStop";

describe("mapBranchAddressToOriginStopSlice", () => {
  const address: BranchAddress = {
    addressId: "addr-1",
    street: "Av. Reforma",
    exteriorNumber: "100",
    interiorNumber: "B",
    neighborhood: "Centro",
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: "06000",
    country: "México",
    satCountryCode: "MEX",
    satStateCode: "CMX",
    satMunicipalityCode: "015",
    satLocalityCode: "01",
    localityName: "Ciudad de México",
    satNeighborhoodCode: "0001",
    latitude: 19.4326,
    longitude: -99.1332,
    locationName: "Bodega central",
  };

  it("maps operational branch address into origin stop form slice", () => {
    const slice = mapBranchAddressToOriginStopSlice(address, "Sucursal principal");

    expect(slice.stopType).toEqual(["origin", "pickup"]);
    expect(slice.locationName).toBe("Bodega central");
    expect(slice.addressId).toBe("");
    expect(slice.sourceAddressId).toBe("addr-1");
    expect(slice.satCountryCode).toBe("MEX");
    expect(slice.satStateCode).toBe("CMX");
    expect(slice.satMunicipalityCode).toBe("015");
    expect(slice.postalCode).toBe("06000");
    expect(slice.street).toBe("Av. Reforma");
    expect(slice.exteriorNumber).toBe("100");
    expect(slice.interiorNumber).toBe("B");
    expect(slice.latitude).toBe(19.4326);
    expect(slice.longitude).toBe(-99.1332);
  });

  it("falls back to branch name when location name is empty", () => {
    const slice = mapBranchAddressToOriginStopSlice(
      { ...address, locationName: "   " },
      "Matriz Norte",
    );

    expect(slice.locationName).toBe("Matriz Norte");
  });
});
