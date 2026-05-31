/**
 * Smoke Fase B — web (validación formulario + parada inline).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CatalogProvider } from "@boeltech/cfdi-domain";
import {
  validateClientAddressFormComplete,
  defaultBillingAddressFormValues,
} from "@features/clients/presentation/validation/clientAddressSchema";
import { validateTripStopAddressComplete } from "@features/trips/presentation/pages/create/validation/tripStopAddressValidation";

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

  it("wizard cliente: CP 44100 mínimo CP31 sin calle ni coords (billingOnCreate)", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultBillingAddressFormValues,
        locationName: "Oficina Fiscal",
        street: "",
        exteriorNumber: "",
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "",
        latitude: null,
        longitude: null,
      },
      { context: "billingOnCreate" },
    );
    expect(result.ok).toBe(true);
  });

  it("wizard cliente: sin nombre del lugar falla (Zod)", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultBillingAddressFormValues,
        locationName: "",
        postalCode: "44100",
        satStateCode: "JAL",
      },
      { context: "billingOnCreate" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.locationName).toBeTruthy();
  });

  it("wizard cliente: CP 44100 sin estado falla (paquete)", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultBillingAddressFormValues,
        locationName: "Oficina Fiscal",
        postalCode: "44100",
        satStateCode: "",
      },
      { context: "billingOnCreate" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const hasStateError =
      result.fieldErrors.satStateCode != null ||
      result.errors.some(
        (e) =>
          e.code === "SAT_STATE_REQUIRED" ||
          e.path === "sat_state_code" ||
          e.path === "satStateCode",
      );
    expect(hasStateError).toBe(true);
  });

  it("parada: CP 44100 con estado, coords y fiscal pasa sin municipio", async () => {
    const result = await validateTripStopAddressComplete(
      {
        stopCategory: "origin",
        stopType: ["origin", "pickup"],
        postalCode: "44100",
        satStateCode: "JAL",
        latitude: 20.67,
        longitude: -103.34,
        rfcRemitenteDestinatario: "XAXX010101000",
        nombreRemitenteDestinatario: "Remitente SA",
      },
      { requireCoordinates: true },
    );
    expect(result.ok).toBe(true);
  });

  it("parada: sin estado falla", async () => {
    const result = await validateTripStopAddressComplete(
      {
        stopCategory: "origin",
        stopType: ["origin", "pickup"],
        postalCode: "44100",
        satStateCode: "",
        latitude: 20.67,
        longitude: -103.34,
        rfcRemitenteDestinatario: "XAXX010101000",
        nombreRemitenteDestinatario: "Remitente SA",
      },
      { requireCoordinates: true },
    );
    expect(result.ok).toBe(false);
  });
});
