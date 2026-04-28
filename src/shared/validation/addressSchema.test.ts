import { describe, expect, it } from "vitest";
import { addressSchema, cartaPorteReadyAddressSchema } from "./addressSchema";

const validBaseAddress = {
  addressType: "billing" as const,
  street: "Av. Lopez Mateos",
  exteriorNumber: "1234",
  interiorNumber: "",
  reference: "",
  postalCode: "44100",
  satCountryCode: "MEX",
  satStateCode: "JAL",
  satMunicipalityCode: "039",
  satLocalityCode: "01",
  satNeighborhoodCode: "0001",
  neighborhoodName: "",
  latitude: null,
  longitude: null,
  isPrimary: false,
};

describe("addressSchema", () => {
  it("accepts valid address payload", () => {
    const result = addressSchema.safeParse(validBaseAddress);
    expect(result.success).toBe(true);
  });

  it("rejects when neighborhood code and name are missing", () => {
    const result = addressSchema.safeParse({
      ...validBaseAddress,
      satNeighborhoodCode: "",
      neighborhoodName: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects when only latitude is provided", () => {
    const result = addressSchema.safeParse({
      ...validBaseAddress,
      latitude: 20.67,
      longitude: null,
    });

    expect(result.success).toBe(false);
  });
});

describe("cartaPorteReadyAddressSchema", () => {
  it("requires locality and sat neighborhood for carta porte", () => {
    const result = cartaPorteReadyAddressSchema.safeParse({
      ...validBaseAddress,
      satLocalityCode: "",
      satNeighborhoodCode: "",
      neighborhoodName: "Moderna",
    });

    expect(result.success).toBe(false);
  });
});
