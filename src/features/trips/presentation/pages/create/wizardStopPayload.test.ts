import { describe, expect, it } from "vitest";

import { buildTripEndpointSummary, mapWizardStopsToCreateInput } from "./wizardStopPayload";
import type { WizardStopRow } from "./wizardStopPayload";

function baseStop(over: Partial<WizardStopRow> = {}): WizardStopRow {
  return {
    sequenceOrder: 0,
    stopType: ["origin", "pickup"],
    clientId: "",
    clientAddressId: "",
    sourceAddressId: "",
    addressId: "",
    locationName: "",
    satCountryCode: "MEX",
    satStateCode: "",
    satMunicipalityCode: "",
    postalCode: "",
    satLocalityCode: "",
    satNeighborhoodCode: "",
    localityName: "",
    cityName: "",
    neighborhoodName: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: "",
    reference: "",
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
    ...over,
  };
}

describe("buildTripEndpointSummary", () => {
  it("uses catalog address label but never locationName as city (F9h)", () => {
    const id = "6cc9d220-c5a4-4671-9f52-68f0af3b32a8";
    const r = buildTripEndpointSummary(
      baseStop({
        sourceAddressId: id,
        locationName: "CEDIS Norte",
        satStateCode: "",
        satMunicipalityCode: "",
      }),
    );
    expect(r.address).toBe("CEDIS Norte");
    expect(r.city).toBe("Ubicación");
  });

  it("prefers localityName over locationName for city (F9h)", () => {
    const id = "6cc9d220-c5a4-4671-9f52-68f0af3b32a8";
    const r = buildTripEndpointSummary(
      baseStop({
        sourceAddressId: id,
        locationName: "Vórtice",
        localityName: "Aguascalientes",
        satMunicipalityCode: "001",
      }),
    );
    expect(r.city).toBe("Aguascalientes");
    expect(r.city).not.toBe("Vórtice");
  });

  it("does not seed city from commercial locationName on replace path (F9h)", () => {
    const out = mapWizardStopsToCreateInput([
      baseStop({
        sequenceOrder: 1,
        stopType: ["destination", "delivery"],
        locationName: "Vórtice",
        // Simula cityHint contaminado omitido: sin cityName ni locality → municipio SAT
        satMunicipalityCode: "001",
        satStateCode: "AGU",
        postalCode: "20305",
        street: "Carretera Panamericana",
        exteriorNumber: "500",
      }),
    ]);
    expect(out![0].locationName).toBe("Vórtice");
    expect(out![0].city).toBe("001");
    expect(out![0].city).not.toBe("Vórtice");
    expect(out![0].city).not.toMatch(/Nissan/i);
  });

  it("does not treat bare addressId snapshot as catalog", () => {
    const id = "6cc9d220-c5a4-4671-9f52-68f0af3b32a8";
    const r = buildTripEndpointSummary(
      baseStop({
        addressId: id,
        street: "Av. Siempre Viva",
        exteriorNumber: "742",
        postalCode: "44100",
        satStateCode: "JAL",
        cityName: "Guadalajara",
        locationName: "CEDIS Norte",
      }),
    );
    expect(r.address).toContain("Av. Siempre Viva");
    expect(r.city).toBe("Guadalajara");
    expect(r.state).toBe("JAL");
  });

  it("builds street line when manual", () => {
    const r = buildTripEndpointSummary(
      baseStop({
        street: "Av. Siempre Viva",
        exteriorNumber: "742",
        postalCode: "44100",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        cityName: "Guadalajara",
      }),
    );
    expect(r.address).toContain("Av. Siempre Viva");
    expect(r.address).toContain("C.P. 44100");
    expect(r.city).toBe("Guadalajara");
    expect(r.state).toBe("JAL");
  });
});

describe("mapWizardStopsToCreateInput", () => {
  it("includes sourceAddressId when stop is linked to catalog snapshot", () => {
    const id = "6cc9d220-c5a4-4671-9f52-68f0af3b32a8";
    const rows = [
      baseStop({
        sequenceOrder: 0,
        clientAddressId: id,
        sourceAddressId: id,
        locationName: "Origen",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        postalCode: "44100",
        street: "Calle",
        exteriorNumber: "1",
      }),
    ];
    const out = mapWizardStopsToCreateInput(rows);
    expect(out).toHaveLength(1);
    expect(out![0].sourceAddressId).toBe(id);
    expect(out![0].addressId).toBeUndefined();
    expect(out![0].address).toBeTruthy();
    expect(out![0].satCountryCode).toBe("MEX");
  });

  it("does not emit sourceAddressId when only addressId snapshot is set", () => {
    const snapshotId = "6e819745-ff6c-49ca-abc0-4d6958a9b852";
    const rows = [
      baseStop({
        sequenceOrder: 0,
        addressId: snapshotId,
        street: "Carretera bosques",
        postalCode: "86991",
        satStateCode: "TAB",
        cityName: "Centro",
        locationName: "Corporativo Tabasco",
      }),
    ];
    const out = mapWizardStopsToCreateInput(rows);
    expect(out![0].sourceAddressId).toBeUndefined();
    expect(out![0].addressId).toBeUndefined();
    expect(out![0].address).toContain("Carretera bosques");
    expect(out![0].city).toBe("Centro");
  });

  it("omits addressId when not a valid unified id", () => {
    const rows = [
      baseStop({
        sequenceOrder: 0,
        addressId: "not-a-uuid",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        postalCode: "44100",
        street: "Calle",
        exteriorNumber: "1",
        cityName: "GDL",
      }),
    ];
    const out = mapWizardStopsToCreateInput(rows);
    expect(out![0].addressId).toBeUndefined();
    expect(out![0].satStateCode).toBe("JAL");
  });
});
