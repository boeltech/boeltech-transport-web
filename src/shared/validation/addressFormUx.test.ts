import { describe, expect, it } from "vitest";
import { billingAddressFormSchema } from "@features/clients/presentation/validation/clientAddressSchema";
import { cp31AddressDomUxSchema } from "./addressFormUx";

const validCp31Base = {
  addressType: "billing" as const,
  street: "",
  exteriorNumber: "",
  interiorNumber: null,
  reference: null,
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

describe("cp31AddressDomUxSchema (shared UX)", () => {
  it("accepts CP31 min without street or exterior", () => {
    const result = cp31AddressDomUxSchema.safeParse({
      ...validCp31Base,
      street: "",
      exteriorNumber: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts SAT composite locality code", () => {
    const result = cp31AddressDomUxSchema.safeParse({
      ...validCp31Base,
      satLocalityCode: "AGU-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts when neighborhood code and name are missing", () => {
    const result = cp31AddressDomUxSchema.safeParse({
      ...validCp31Base,
      satNeighborhoodCode: "",
      neighborhoodName: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty municipality when other SAT base fields are valid", () => {
    const result = cp31AddressDomUxSchema.safeParse({
      ...validCp31Base,
      satMunicipalityCode: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when only latitude is provided", () => {
    const result = cp31AddressDomUxSchema.safeParse({
      ...validCp31Base,
      latitude: 20.67,
      longitude: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("billingAddressFormSchema (wizard paso 2)", () => {
  it("rechaza estado y CP vacíos con mensajes en español", () => {
    const result = billingAddressFormSchema.safeParse({
      ...validCp31Base,
      addressType: "billing",
      isPrimary: true,
      locationName: "Matriz",
      satStateCode: "",
      postalCode: "",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const messages = result.error.issues.map((i) => i.message);
    expect(messages).toContain("El estado es requerido");
    expect(messages).toContain("El código postal es requerido");
  });

  it("rechaza CP con formato inválido", () => {
    const result = billingAddressFormSchema.safeParse({
      ...validCp31Base,
      addressType: "billing",
      isPrimary: true,
      locationName: "Matriz",
      satStateCode: "JAL",
      postalCode: "441",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(
      result.error.issues.some((i) =>
        i.message.includes("El código postal debe tener 5 dígitos"),
      ),
    ).toBe(true);
  });
});
