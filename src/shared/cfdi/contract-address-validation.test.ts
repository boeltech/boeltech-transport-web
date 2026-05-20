import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CatalogProvider } from "@boeltech/cfdi-domain";
import {
  mapValidationErrorsToRHF,
  parseClientAddressFormCreate,
} from "./addressPayloadBridge";

function createMockProvider(): CatalogProvider {
  return {
    getCatalogItem: () => null,
    getPostalCodeLookup: async (postalCode: string) => {
      if (postalCode === "44100") {
        return {
          postal_code: postalCode,
          found: true,
          state_code: "JAL",
          municipality_code: "039",
          localities: [{ code: "01", name: "Guadalajara" }],
          neighborhoods: [{ code: "0441", name: "Americana" }],
        };
      }
      return {
        postal_code: postalCode,
        found: true,
        state_code: "JAL",
        municipality_code: "039",
        localities: [],
        neighborhoods: [],
      };
    },
  };
}

vi.mock("./catalogProviderRest", () => ({
  createCatalogProviderRest: vi.fn(() => createMockProvider()),
}));

describe("contract address validation (web ↔ cfdi-domain)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps SAT paths to camelCase RHF field keys", () => {
    const mapped = mapValidationErrorsToRHF([
      {
        code: "SAT_MUNICIPALITY_REQUIRED",
        message: "Municipio requerido",
        path: "sat_municipality_code",
      },
      {
        code: "POSTAL_CODE_REQUIRED",
        message: "CP inválido",
        path: "postal_code",
      },
    ]);
    expect(mapped.satMunicipalityCode).toBe("Municipio requerido");
    expect(mapped.postalCode).toBe("CP inválido");
  });

  it("fails CP 44100 without municipality/locality/neighborhood in carta_porte_31", async () => {
    const result = await parseClientAddressFormCreate(
      {
        addressType: "billing",
        street: "Av Vallarta",
        exteriorNumber: "123",
        postalCode: "44100",
        satCountryCode: "MEX",
        satStateCode: "JAL",
        satMunicipalityCode: "",
        latitude: 20.67,
        longitude: -103.34,
      },
      { context: "billing", mode: "carta_porte_31", requireCoordinates: true },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.satMunicipalityCode).toBeTruthy();
  });

  it("accepts CP 64000 without locality when catalog does not require them", async () => {
    const result = await parseClientAddressFormCreate(
      {
        addressType: "billing",
        street: "Av Test",
        exteriorNumber: "1",
        postalCode: "64000",
        satCountryCode: "MEX",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        latitude: 20.67,
        longitude: -103.34,
      },
      { context: "billing", mode: "carta_porte_31", requireCoordinates: true },
    );
    expect(result.ok).toBe(true);
  });
});
