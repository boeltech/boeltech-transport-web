import { describe, expect, it } from "vitest";
import type { ClientAddress } from "@features/clients/domain/entities";

import {
  getEmptyStopDialogValues,
  mergeDialogWithClientCatalog,
} from "./stopDialogAddressMapper";

const catalogWithCoords = {
  id: "catalog-addr-id",
  tenantId: "tenant-1",
  clientId: "client-1",
  addressType: "shipping" as const,
  isPrimary: false,
  isActive: true,
  locationName: "CEDIS",
  satCountryCode: "MEX",
  satStateCode: "NL",
  satMunicipalityCode: "039",
  postalCode: "67140",
  street: "Av Original",
  exteriorNumber: "100",
  latitude: 25.1,
  longitude: -100.1,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
} satisfies ClientAddress;

const catalogNoCoords = {
  id: "catalog-addr-id",
  tenantId: "tenant-1",
  clientId: "client-1",
  addressType: "shipping" as const,
  isPrimary: false,
  isActive: true,
  satCountryCode: "MEX",
  satStateCode: "NL",
  satMunicipalityCode: "039",
  postalCode: "67140",
  street: "Av",
  latitude: undefined,
  longitude: undefined,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
} satisfies ClientAddress;

describe("mergeDialogWithClientCatalog — coordenadas", () => {
  it("no pisa lat/lng del formulario cuando el catalogo viene sin coords", () => {
    const w = {
      ...getEmptyStopDialogValues(),
      clientId: "client-1",
      clientAddressId: catalogNoCoords.id,
      addressId: catalogNoCoords.id,
      latitude: 25.665703,
      longitude: -100.267075,
      stopCategory: "waypoint" as const,
      stopType: ["waypoint", "delivery"] as ["waypoint", "delivery"],
    };

    const out = mergeDialogWithClientCatalog(w, catalogNoCoords, true, null);

    expect(out.latitude).toBe(25.665703);
    expect(out.longitude).toBe(-100.267075);
  });

  it("prioriza calle editada en formulario aunque el catalogo tenga geo", () => {
    const w = {
      ...getEmptyStopDialogValues(),
      clientId: "client-1",
      clientAddressId: catalogWithCoords.id,
      addressId: catalogWithCoords.id,
      street: "Av Editada",
      latitude: 25.2,
      longitude: -100.2,
      stopCategory: "waypoint" as const,
      stopType: ["delivery"] as ["delivery"],
    };

    const out = mergeDialogWithClientCatalog(w, catalogWithCoords, true, null);

    expect(out.street).toBe("Av Editada");
    expect(out.latitude).toBe(25.2);
    expect(out.longitude).toBe(-100.2);
  });
});
