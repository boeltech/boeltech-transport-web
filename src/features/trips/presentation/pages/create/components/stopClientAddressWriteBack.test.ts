import { describe, expect, it } from "vitest";

import type { ClientAddress } from "@features/clients/domain/entities";

import {
  canOfferClientAddressWriteBack,
  detachStopFromClientCatalog,
  stopDialogDiffersFromClientCatalog,
} from "./stopClientAddressWriteBack";
import { getEmptyStopDialogValues } from "./stopDialogAddressMapper";

function baseCatalog(overrides: Partial<ClientAddress> = {}): ClientAddress {
  return {
    id: "addr-1",
    tenantId: "tenant-1",
    clientId: "client-1",
    addressType: "shipping",
    isPrimary: false,
    isActive: true,
    locationName: "CEDIS Norte",
    street: "Av Principal",
    exteriorNumber: "100",
    interiorNumber: undefined,
    reference: undefined,
    postalCode: "64000",
    satCountryCode: "MEX",
    satStateCode: "19",
    satMunicipalityCode: "006",
    latitude: undefined,
    longitude: undefined,
    contactName: "",
    contactPhone: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("stopClientAddressWriteBack", () => {
  it("detecta cambio al agregar coordenadas", () => {
    const catalog = baseCatalog();
    const form = {
      ...getEmptyStopDialogValues(),
      locationName: "CEDIS Norte",
      street: "Av Principal",
      exteriorNumber: "100",
      postalCode: "64000",
      satCountryCode: "MEX",
      satStateCode: "19",
      satMunicipalityCode: "006",
      latitude: 25.67,
      longitude: -100.31,
    };

    expect(stopDialogDiffersFromClientCatalog(form, catalog)).toBe(true);
  });

  it("no marca diff si el domicilio coincide", () => {
    const catalog = baseCatalog({
      latitude: 25.67,
      longitude: -100.31,
    });
    const form = {
      ...getEmptyStopDialogValues(),
      locationName: "CEDIS Norte",
      street: "Av Principal",
      exteriorNumber: "100",
      postalCode: "64000",
      satCountryCode: "MEX",
      satStateCode: "19",
      satMunicipalityCode: "006",
      latitude: 25.67,
      longitude: -100.31,
    };

    expect(stopDialogDiffersFromClientCatalog(form, catalog)).toBe(false);
  });

  it("no marca diff tras precarga picker con huecos de snapshot (localidad/interior)", () => {
    const catalog = baseCatalog({
      satLocalityCode: "001",
      localityName: "Monterrey",
      interiorNumber: "B",
      contactName: "Recepción",
      contactPhone: "8180000000",
    });
    const form = {
      ...getEmptyStopDialogValues(),
      locationName: "CEDIS Norte",
      street: "Av Principal",
      exteriorNumber: "100",
      postalCode: "64000",
      satCountryCode: "MEX",
      satStateCode: "19",
      satMunicipalityCode: "006",
      satLocalityCode: null,
      localityName: null,
      interiorNumber: null,
      contactName: "",
      contactPhone: "",
    };

    expect(stopDialogDiffersFromClientCatalog(form, catalog)).toBe(false);
  });

  it("no marca diff si códigos SAT usan formato corto vs prefijo en catálogo", () => {
    const catalog = baseCatalog({
      satMunicipalityCode: "MEX-19-006",
      satNeighborhoodCode: "COL-0123",
    });
    const form = {
      ...getEmptyStopDialogValues(),
      locationName: "CEDIS Norte",
      street: "Av Principal",
      exteriorNumber: "100",
      postalCode: "64000",
      satCountryCode: "MEX",
      satStateCode: "19",
      satMunicipalityCode: "006",
      satNeighborhoodCode: "0123",
    };

    expect(stopDialogDiffersFromClientCatalog(form, catalog)).toBe(false);
  });

  it("marca diff si el usuario editó calle tras precarga", () => {
    const catalog = baseCatalog({
      satLocalityCode: "001",
      localityName: "Monterrey",
    });
    const form = {
      ...getEmptyStopDialogValues(),
      locationName: "CEDIS Norte",
      street: "Calle editada por usuario",
      exteriorNumber: "100",
      postalCode: "64000",
      satCountryCode: "MEX",
      satStateCode: "19",
      satMunicipalityCode: "006",
      satLocalityCode: null,
      localityName: null,
    };

    expect(stopDialogDiffersFromClientCatalog(form, catalog)).toBe(true);
  });

  it("detachStopFromClientCatalog limpia ids de catálogo", () => {
    expect(
      detachStopFromClientCatalog({
        addressId: "addr-1",
        clientAddressId: "addr-1",
        clientId: "c1",
      }),
    ).toEqual({
      addressId: undefined,
      clientAddressId: undefined,
      clientId: "c1",
    });
  });

  it("ofrece write-back solo con clients.update y tipo operativo", () => {
    expect(canOfferClientAddressWriteBack(baseCatalog(), true)).toBe(true);
    expect(canOfferClientAddressWriteBack(baseCatalog(), false)).toBe(false);
    expect(
      canOfferClientAddressWriteBack(baseCatalog({ addressType: "billing" }), true),
    ).toBe(false);
    expect(
      canOfferClientAddressWriteBack(baseCatalog({ addressType: "office" }), true),
    ).toBe(false);
    expect(canOfferClientAddressWriteBack(undefined, true)).toBe(false);
  });
});
