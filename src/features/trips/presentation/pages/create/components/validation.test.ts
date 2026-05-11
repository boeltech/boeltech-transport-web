import { describe, expect, it } from "vitest";
import {
  stopHasUnifiedAddressId,
  tripStopSchema,
  tripCargoSchema,
  validateRouteStep,
  type TripStopFormValues,
} from "./validation";
import {
  fillMissingDistancesFromCoordinates,
  hasMissingStopDistances,
} from "./stopDistanceHelpers";

function buildBaseStop(
  overrides: Partial<TripStopFormValues> = {},
): TripStopFormValues {
  return {
    sequenceOrder: 0,
    stopType: ["origin", "pickup"],
    clientId: "",
    clientAddressId: "",
    addressId: "",
    locationName: "Parada de prueba",
    satCountryCode: "MEX",
    satStateCode: "",
    satMunicipalityCode: "",
    postalCode: "",
    satLocalityCode: "",
    satNeighborhoodCode: "",
    cityName: "",
    neighborhoodName: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: "",
    reference: "",
    latitude: 25.6866,
    longitude: -100.3161,
    rfcRemitenteDestinatario: "",
    nombreRemitenteDestinatario: "",
    deliveryRfcRemitenteDestinatario: "",
    deliveryNombreRemitenteDestinatario: "",
    remitentePartnerId: "",
    destinatarioPartnerId: "",
    contactName: "",
    contactPhone: "",
    notes: "",
    distanceFromPreviousKm: undefined,
    ...overrides,
  };
}

describe("trip stop address validation", () => {
  it("recognizes a valid unified address id", () => {
    expect(
      stopHasUnifiedAddressId({
        addressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
      }),
    ).toBe(true);
  });

  it("requires SAT fields for manual stops", () => {
    const result = tripStopSchema.safeParse(
      buildBaseStop({
        addressId: "",
        satCountryCode: "",
      }),
    );

    expect(result.success).toBe(false);
  });

  it("allows stop linked to unified address without manual SAT fields", () => {
    const result = tripStopSchema.safeParse(
      buildBaseStop({
        addressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
        clientAddressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
      }),
    );

    expect(result.success).toBe(true);
  });
});

describe("tripCargoSchema — seguro de carga", () => {
  const baseCargo = {
    description: "Carga de prueba",
    satProductCode: "10101501",
    satUnitCode: "H87",
    units: 10,
    weightInKg: 250,
  };

  it("allows uninsured cargo without insurance fields", () => {
    const result = tripCargoSchema.safeParse({
      ...baseCargo,
      isInsured: false,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.currency).toBe("MXN");
  });

  it("rejects insured cargo without declared value, insurer, or policy", () => {
    const result = tripCargoSchema.safeParse({
      ...baseCargo,
      isInsured: true,
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining(["declaredValue", "aseguraCarga", "polizaCarga"]),
    );
  });

  it("accepts insured cargo with complete insurance data", () => {
    const result = tripCargoSchema.safeParse({
      ...baseCargo,
      isInsured: true,
      declaredValue: 15000,
      aseguraCarga: "Qualitas",
      polizaCarga: "CARGA-001",
    });
    expect(result.success).toBe(true);
  });
});

describe("validateRouteStep with unified addresses", () => {
  it("does not require SAT fields when stop has addressId", () => {
    const origin = buildBaseStop({
      sequenceOrder: 0,
      stopType: ["origin", "pickup"],
      locationName: "Origen",
      addressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
      clientAddressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
    });

    const destination = buildBaseStop({
      sequenceOrder: 1,
      stopType: ["destination", "delivery"],
      locationName: "Destino",
      addressId: "9e85dca1-8b0f-4d3a-a0ff-7f803a5210e4",
      clientAddressId: "9e85dca1-8b0f-4d3a-a0ff-7f803a5210e4",
      estimatedArrival: "2026-04-25T10:00",
      distanceFromPreviousKm: 35,
    });

    const validation = validateRouteStep([origin, destination]);

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  it("keeps manual SAT requirements when addressId is missing", () => {
    const origin = buildBaseStop({
      sequenceOrder: 0,
      stopType: ["origin", "pickup"],
      locationName: "Origen manual",
    });

    const destination = buildBaseStop({
      sequenceOrder: 1,
      stopType: ["destination", "delivery"],
      locationName: "Destino manual",
      estimatedArrival: "2026-04-25T10:00",
      distanceFromPreviousKm: 10,
    });

    const validation = validateRouteStep([origin, destination]);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((err) => err.includes("estado"))).toBe(
      true,
    );
  });
});

describe("distanceFromPreviousKm business rules", () => {
  it("does not require distance for origin", () => {
    const result = tripStopSchema.safeParse(
      buildBaseStop({
        stopType: ["origin", "pickup"],
        addressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
        clientAddressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
        distanceFromPreviousKm: undefined,
      }),
    );

    expect(result.success).toBe(true);
  });

  it("allows non-origin stops without distance (filled before leaving route step or submit)", () => {
    const result = tripStopSchema.safeParse(
      buildBaseStop({
        stopType: ["destination", "delivery"],
        addressId: "9e85dca1-8b0f-4d3a-a0ff-7f803a5210e4",
        clientAddressId: "9e85dca1-8b0f-4d3a-a0ff-7f803a5210e4",
        estimatedArrival: "2026-04-25T10:00",
        distanceFromPreviousKm: undefined,
      }),
    );

    expect(result.success).toBe(true);
  });
});

describe("stopDistanceHelpers", () => {
  it("hasMissingStopDistances is false for a single stop", () => {
    expect(hasMissingStopDistances([buildBaseStop()])).toBe(false);
  });

  it("hasMissingStopDistances when a non-first stop lacks distance", () => {
    const stops: TripStopFormValues[] = [
      buildBaseStop({ sequenceOrder: 0 }),
      buildBaseStop({
        sequenceOrder: 1,
        stopType: ["destination", "delivery"],
        addressId: "9e85dca1-8b0f-4d3a-a0ff-7f803a5210e4",
        clientAddressId: "9e85dca1-8b0f-4d3a-a0ff-7f803a5210e4",
        estimatedArrival: "2026-04-25T10:00",
        distanceFromPreviousKm: undefined,
      }),
    ];
    expect(hasMissingStopDistances(stops)).toBe(true);
  });

  it("fillMissingDistancesFromCoordinates fills empty segments when both stops have coordinates", () => {
    const origin = buildBaseStop({
      sequenceOrder: 0,
      latitude: 19.4326,
      longitude: -99.1332,
      addressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
      clientAddressId: "6cc9d220-c5a4-4671-9f52-68f0af3b32a8",
    });
    const destination = buildBaseStop({
      sequenceOrder: 1,
      stopType: ["destination", "delivery"],
      addressId: "9e85dca1-8b0f-4d3a-a0ff-7f803a5210e4",
      clientAddressId: "9e85dca1-8b0f-4d3a-a0ff-7f803a5210e4",
      estimatedArrival: "2026-04-25T10:00",
      distanceFromPreviousKm: undefined,
      latitude: 20.9674,
      longitude: -89.5926,
    });
    const filled = fillMissingDistancesFromCoordinates([origin, destination]);
    expect(filled[1]?.distanceFromPreviousKm).toBeGreaterThan(0);
    expect(hasMissingStopDistances(filled)).toBe(false);
  });
});

describe("tripCargoSchema — material peligroso", () => {
  const baseCargo = {
    description: "Pintura industrial",
    satProductCode: "12141901",
    satUnitCode: "H87",
    units: 5,
    weightInKg: 100,
  };

  it("requires hazmat fields when hazardousMaterial is true", () => {
    const result = tripCargoSchema.safeParse({
      ...baseCargo,
      hazardousMaterial: true,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining([
        "hazardousMaterialCode",
        "packagingType",
        "packagingDescription",
      ]),
    );
  });

  it("accepts hazardous cargo when hazmat data is complete", () => {
    const result = tripCargoSchema.safeParse({
      ...baseCargo,
      hazardousMaterial: true,
      hazardousMaterialCode: "UN1263",
      packagingType: "4G",
      packagingDescription: "Cajas certificadas UN",
    });

    expect(result.success).toBe(true);
  });

  it("requires hazmat section when product catalog marks hazardous", () => {
    const result = tripCargoSchema.safeParse({
      ...baseCargo,
      requiresHazmat: true,
      hazardousMaterial: false,
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((i) => i.path[0]);
    expect(paths).toContain("hazardousMaterial");
  });
});

describe("tripCargoSchema — sectores regulados", () => {
  it("requires sector fields when marked as mandatory by metadata", () => {
    const result = tripCargoSchema.safeParse({
      description: "Medicamento controlado",
      satProductCode: "51101599",
      satUnitCode: "H87",
      units: 1,
      weightInKg: 1,
      sectorRequirements: {
        sectorCofepris: true,
        loteMedicamento: true,
      },
      sectorCofepris: "",
      loteMedicamento: "",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining(["sectorCofepris", "loteMedicamento"]),
    );
  });
});
