import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CatalogProvider } from "@boeltech/cfdi-domain";
import { isCartaPorteListBadgeReady } from "@boeltech/cfdi-domain";
import {
  mapValidationErrorsToRHF,
  parseClientAddressFormCreate,
} from "./addressPayloadBridge";
import { isCartaPorteReady } from "@features/clients/domain/entities";
import {
  validateClientAddressFormComplete,
  defaultClientAddressFormValues,
} from "@features/clients/presentation/validation/clientAddressSchema";
import {
  validateEmployeePersonalAddressFormComplete,
  defaultEmployeePersonalAddressValues,
} from "@features/employees/presentation/validation/employeePersonalAddressSchema";
import { validateTripStopAddressComplete } from "@features/trips/presentation/pages/create/validation/tripStopAddressValidation";

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

  it("accepts personal CP31 min without street, exterior, locationName, or coordinates", async () => {
    const result = await parseClientAddressFormCreate(
      {
        addressType: "personal",
        postalCode: "44100",
        satCountryCode: "MEX",
        satStateCode: "JAL",
        satMunicipalityCode: "",
      },
      { context: "personal", requireCoordinates: false },
    );
    expect(result.ok).toBe(true);
  });

  it("validateEmployeePersonalAddressFormComplete accepts domicilio sin calle", async () => {
    const result = await validateEmployeePersonalAddressFormComplete({
      ...defaultEmployeePersonalAddressValues,
      postalCode: "44100",
      satStateCode: "JAL",
      satCountryCode: "MEX",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts billing CP31 min without street, exterior, or coordinates", async () => {
    const result = await parseClientAddressFormCreate(
      {
        addressType: "billing",
        locationName: "Oficina Fiscal",
        postalCode: "44100",
        satCountryCode: "MEX",
        satStateCode: "JAL",
        satMunicipalityCode: "",
      },
      { context: "billing", requireCoordinates: false },
    );
    expect(result.ok).toBe(true);
  });

  it("requires coordinates when requireCoordinates is true", async () => {
    const result = await parseClientAddressFormCreate(
      {
        addressType: "billing",
        street: "Av Vallarta",
        exteriorNumber: "123",
        postalCode: "44100",
        satCountryCode: "MEX",
        satStateCode: "JAL",
      },
      { context: "billing", requireCoordinates: true },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.latitude ?? result.errors[0]?.code).toBeTruthy();
  });

  it("web isCartaPorteReady matches package list badge (state + CP, XSD)", () => {
    const base = {
      id: "addr-1",
      tenantId: "t1",
      clientId: "c1",
      satCountryCode: "MEX",
      satStateCode: "JAL",
      satMunicipalityCode: "039",
      postalCode: "44100",
      addressType: "billing" as const,
      isPrimary: false,
      isActive: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    expect(isCartaPorteReady(base)).toBe(
      isCartaPorteListBadgeReady({
        sat_country_code: "MEX",
        sat_state_code: "JAL",
        sat_municipality_code: "039",
        postal_code: "44100",
      }),
    );
    expect(
      isCartaPorteReady({ ...base, satStateCode: "", postalCode: "441" }),
    ).toBe(false);
  });

  it("validateClientAddressFormComplete: shipping CP31 min without street (additional)", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultClientAddressFormValues,
        addressType: "shipping",
        locationName: "Bodega Norte",
        street: "",
        exteriorNumber: "",
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "",
      },
      { context: "additional", requireCoordinates: false },
    );
    expect(result.ok).toBe(true);
  });

  it("validateClientAddressFormComplete: rejects additional without locationName", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultClientAddressFormValues,
        addressType: "warehouse",
        locationName: "",
        postalCode: "44100",
        satStateCode: "JAL",
      },
      { context: "additional" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(
      result.fieldErrors.locationName ??
        result.errors.some((e) => e.path === "location_name"),
    ).toBeTruthy();
  });

  it("validateCompanyFiscalAddressFormComplete: company CP31 min without street", async () => {
    const { validateCompanyFiscalAddressFormComplete } = await import(
      "@features/settings/presentation/validation/companyFiscalAddressSchema"
    );
    const result = await validateCompanyFiscalAddressFormComplete(
      {
        addressType: "company",
        isPrimary: true,
        locationName: "Matriz fiscal",
        street: "",
        exteriorNumber: "",
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "",
        satCountryCode: "MEX",
        interiorNumber: null,
        reference: null,
        satLocalityCode: null,
        localityName: null,
        satNeighborhoodCode: null,
        neighborhoodName: null,
        latitude: null,
        longitude: null,
        rfcRemitenteDestinatario: "",
        nombreRemitenteDestinatario: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
        businessHours: "",
        notes: "",
        specialInstructions: "",
      },
      { requireCoordinates: false },
    );
    expect(result.ok).toBe(true);
  });

  it("validateClientAddressFormComplete: rejects missing state (package)", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultClientAddressFormValues,
        locationName: "Sucursal",
        postalCode: "44100",
        satStateCode: "",
      },
      { context: "additional" },
    );
    expect(result.ok).toBe(false);
  });

  it("validateTripStopAddressComplete: coords + SAT for trip_stop (inline)", async () => {
    const result = await validateTripStopAddressComplete({
      stopCategory: "origin",
      stopType: ["origin", "pickup"],
      addressType: "trip_stop",
      locationName: "Origen",
      postalCode: "44100",
      satCountryCode: "MEX",
      satStateCode: "JAL",
      latitude: 20.67,
      longitude: -103.34,
      rfcRemitenteDestinatario: "XAXX010101000",
      nombreRemitenteDestinatario: "Remitente SA",
    });
    expect(result.ok).toBe(true);
  });

  it("validateTripStopAddressComplete: fails without coords or fiscal", async () => {
    const noCoords = await validateTripStopAddressComplete({
      stopCategory: "origin",
      stopType: ["origin", "pickup"],
      postalCode: "44100",
      satStateCode: "JAL",
      rfcRemitenteDestinatario: "XAXX010101000",
      nombreRemitenteDestinatario: "Remitente SA",
    });
    expect(noCoords.ok).toBe(false);

    const noFiscal = await validateTripStopAddressComplete({
      stopCategory: "origin",
      stopType: ["origin", "pickup"],
      postalCode: "44100",
      satStateCode: "JAL",
      latitude: 20.67,
      longitude: -103.34,
      rfcRemitenteDestinatario: "",
      nombreRemitenteDestinatario: "",
    });
    expect(noFiscal.ok).toBe(false);
    if (!noFiscal.ok) {
      const fiscalMsg =
        noFiscal.fieldErrors.rfcRemitenteDestinatario ??
        noFiscal.fieldErrors.nombreRemitenteDestinatario;
      expect(fiscalMsg).toBeTruthy();
    }
  });

  it("validateTripStopAddressComplete: keepBillingCollapsed skips fiscal, still requires coords", async () => {
    const withoutFiscal = await validateTripStopAddressComplete(
      {
        stopCategory: "origin",
        stopType: ["origin", "pickup"],
        addressType: "trip_stop",
        locationName: "Origen",
        postalCode: "44100",
        satCountryCode: "MEX",
        satStateCode: "JAL",
        latitude: 20.67,
        longitude: -103.34,
      },
      { requireCoordinates: true, requireFiscal: false },
    );
    expect(withoutFiscal.ok).toBe(true);

    const withoutCoords = await validateTripStopAddressComplete(
      {
        stopCategory: "origin",
        stopType: ["origin", "pickup"],
        addressType: "trip_stop",
        locationName: "Origen",
        postalCode: "44100",
        satCountryCode: "MEX",
        satStateCode: "JAL",
      },
      { requireCoordinates: true, requireFiscal: false },
    );
    expect(withoutCoords.ok).toBe(false);
  });

  // ADR-ADDR P4 — Matriz §7 (PATCH)
  it("validateClientAddressFormComplete intent=update: shipping legacy sin street pasa", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultClientAddressFormValues,
        addressType: "shipping",
        locationName: "Bodega Norte",
        street: "",
        exteriorNumber: "",
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "",
      },
      { context: "additional", requireCoordinates: false, intent: "update" },
    );
    expect(result.ok).toBe(true);
  });

  it("validateClientAddressFormComplete intent=update: rechaza estado vacío con CP touched", async () => {
    const result = await validateClientAddressFormComplete(
      {
        ...defaultClientAddressFormValues,
        addressType: "shipping",
        locationName: "Bodega",
        postalCode: "44100",
        satStateCode: "",
      },
      { context: "additional", intent: "update" },
    );
    expect(result.ok).toBe(false);
  });

  it("accepts CP 64000 without locality when catalog does not require them", async () => {
    const result = await parseClientAddressFormCreate(
      {
        addressType: "billing",
        locationName: "CEDIS Norte",
        street: "Av Test",
        exteriorNumber: "1",
        postalCode: "64000",
        satCountryCode: "MEX",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        latitude: 20.67,
        longitude: -103.34,
      },
      { context: "billing", requireCoordinates: true },
    );
    expect(result.ok).toBe(true);
  });
});
