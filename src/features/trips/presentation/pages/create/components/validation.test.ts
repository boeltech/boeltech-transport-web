import { describe, expect, it } from "vitest";
import {
  stopHasUnifiedAddressId,
  tripStopSchema,
  tripCargoSchema,
  validateRouteStep,
  type TripStopFormValues,
} from "./validation";

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
    satEstadoCode: "",
    satMunicipioCode: "",
    postalCode: "",
    satLocalidadCode: "",
    satColoniaCode: "",
    cityName: "",
    colonia: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: "",
    reference: "",
    rfcRemitenteDestinatario: "",
    nombreRemitenteDestinatario: "",
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
  it("allows uninsured cargo without insurance fields", () => {
    const result = tripCargoSchema.safeParse({
      description: "Carga de prueba",
      isInsured: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects insured cargo without declared value, insurer, or policy", () => {
    const result = tripCargoSchema.safeParse({
      description: "Carga de prueba",
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
      description: "Carga de prueba",
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
    expect(validation.errors.some((err) => err.includes("estado SAT"))).toBe(
      true,
    );
  });
});
