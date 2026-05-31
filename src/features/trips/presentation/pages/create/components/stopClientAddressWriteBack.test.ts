import { describe, expect, it } from "vitest";

import type { ClientAddress } from "@features/clients/domain/entities";

import {
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
});
