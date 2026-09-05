import { describe, expect, it } from "vitest";

import type { LocationValue } from "./LocationField.types";
import {
  emptySatAddressFields,
  locationValueFromSatAddressFields,
  locationValueToSatAddressFields,
} from "./locationValueToSatAddressFields";

describe("locationValueToSatAddressFields", () => {
  it("maps LocationValue and shortens compound SAT codes", () => {
    const value: LocationValue = {
      locationName: "  Bodega Norte  ",
      street: "Av Reforma",
      exteriorNumber: "100",
      postalCode: "06600",
      satCountryCode: "MEX",
      satStateCode: "CMX",
      satMunicipalityCode: "CMX-015",
      satLocalityCode: "CMX-0001",
      satNeighborhoodCode: "CMX-0001-01",
      neighborhoodName: "Juárez",
      latitude: 19.43,
      longitude: -99.13,
      geocodingAccuracy: "approximate",
    };

    expect(locationValueToSatAddressFields(value)).toEqual({
      locationName: "Bodega Norte",
      street: "Av Reforma",
      exteriorNumber: "100",
      interiorNumber: null,
      reference: null,
      postalCode: "06600",
      satCountryCode: "MEX",
      satStateCode: "CMX",
      satMunicipalityCode: "015",
      satLocalityCode: "0001",
      localityName: null,
      satNeighborhoodCode: "01",
      neighborhoodName: "Juárez",
      latitude: 19.43,
      longitude: -99.13,
      geocodingAccuracy: "approximate",
    });
  });

  it("emptySatAddressFields resets to MEX defaults", () => {
    expect(emptySatAddressFields().satCountryCode).toBe("MEX");
    expect(emptySatAddressFields().street).toBe("");
  });
});

describe("locationValueFromSatAddressFields", () => {
  it("returns null without signal", () => {
    expect(locationValueFromSatAddressFields({})).toBeNull();
    expect(locationValueFromSatAddressFields({ street: "  " })).toBeNull();
  });

  it("builds LocationValue from postal code alone", () => {
    const value = locationValueFromSatAddressFields({ postalCode: "06600" });
    expect(value).toMatchObject({
      locationName: null,
      postalCode: "06600",
    });
  });
});
