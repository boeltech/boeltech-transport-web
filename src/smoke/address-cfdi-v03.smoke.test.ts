/**
 * Smoke Fase B — web (validación formulario + parada inline).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CatalogProvider } from "@boeltech/cfdi-domain";
import {
  validateClientAddressFormComplete,
  defaultBillingAddressFormValues,
} from "@features/clients/presentation/validation/clientAddressSchema";
import { validateTripStopInlineAddress } from "@shared/cfdi/addressPayloadBridge";

function mockCatalogProvider(): CatalogProvider {
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

vi.mock("@shared/cfdi/catalogProviderRest", () => ({
  createCatalogProviderRest: () => mockCatalogProvider(),
}));

describe("smoke address-cfdi v0.3 web", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wizard cliente: CP 44100 sin SAT completo falla con coords requeridas", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultBillingAddressFormValues,
        street: "Av Vallarta",
        exteriorNumber: "123",
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "",
        latitude: 20.67,
        longitude: -103.34,
      },
      { context: "billingOnCreate", requireCoordinates: true },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.code === "SAT_MUNICIPALITY_REQUIRED")).toBe(
      true,
    );
  });

  it("wizard cliente: CP 44100 SAT completo pasa", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultBillingAddressFormValues,
        street: "Av Vallarta",
        exteriorNumber: "123",
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        satLocalityCode: "01",
        satNeighborhoodCode: "0441",
        latitude: 20.67,
        longitude: -103.34,
      },
      { context: "billingOnCreate", requireCoordinates: true },
    );
    expect(result.ok).toBe(true);
  });

  it("parada inline: CP 44100 sin municipio falla", async () => {
    const result = await validateTripStopInlineAddress(
      {
        postalCode: "44100",
        satStateCode: "JAL",
        latitude: 20.67,
        longitude: -103.34,
      },
      { requireCoordinates: true },
    );
    expect(result.ok).toBe(false);
  });

  it("parada inline: SAT + coords completos pasan", async () => {
    const result = await validateTripStopInlineAddress(
      {
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        satLocalityCode: "01",
        satNeighborhoodCode: "0441",
        latitude: 20.67,
        longitude: -103.34,
      },
      { requireCoordinates: true },
    );
    expect(result.ok).toBe(true);
  });
});
