import { describe, expect, it } from "vitest";
import type { ClientAddress } from "@features/clients/domain/entities";
import type { AddressSearchListItem } from "@shared/ui/address-picker/types";

import {
  addressSearchItemToDialogSlice,
  applyAddressPickerClearSlice,
  buildStopPrefillRefFromSearchItem,
  getEmptyStopDialogValues,
  mergeDialogWithClientCatalog,
  shouldShowPrefillMissingGeolocationNotice,
} from "./stopDialogAddressMapper";

const partnerSearchItem: AddressSearchListItem = {
  id: "partner-addr-1",
  ownerType: "tenant",
  ownerId: "partner-1",
  ownerLabel: "Transportes Norte",
  addressType: "warehouse",
  locationName: "Bodega Apodaca",
  street: "Av Industria",
  exteriorNumber: "120",
  postalCode: "66600",
  satStateCode: "19",
  satMunicipalityCode: "006",
  neighborhoodName: "Parque Industrial",
  satNeighborhoodCode: "0001",
  latitude: 25.78,
  longitude: -100.18,
  geolocationPending: false,
  isPrimary: false,
  isActive: true,
  isCartaPorteReady: true,
};

const clientSearchItem: AddressSearchListItem = {
  ...partnerSearchItem,
  id: "client-addr-1",
  ownerType: "client",
  ownerId: "client-1",
  ownerLabel: "Cliente SA",
};

describe("addressSearchItemToDialogSlice — snapshot ADR-0053", () => {
  it("volca SAT/geo sin addressId ni clientAddressId", () => {
    const slice = addressSearchItemToDialogSlice(partnerSearchItem);

    expect(slice.addressId).toBe("");
    expect(slice.clientAddressId).toBe("");
    expect(slice.clientId).toBe("");
    expect(slice.locationName).toBe("Bodega Apodaca");
    expect(slice.street).toBe("Av Industria");
    expect(slice.latitude).toBe(25.78);
  });

  it("setea clientId solo cuando ownerType es client", () => {
    const slice = addressSearchItemToDialogSlice(clientSearchItem);

    expect(slice.clientId).toBe("client-1");
    expect(slice.addressId).toBe("");
    expect(slice.clientAddressId).toBe("client-addr-1");
  });

  it("copia RFC y nombre fiscal cuando la fuente los trae", () => {
    const slice = addressSearchItemToDialogSlice({
      ...clientSearchItem,
      remitenteRfc: "AAA010101AAA",
      remitenteName: "Cliente Demo SA",
    });

    expect(slice.rfcRemitenteDestinatario).toBe("AAA010101AAA");
    expect(slice.nombreRemitenteDestinatario).toBe("Cliente Demo SA");
  });
});

describe("buildStopPrefillRefFromSearchItem", () => {
  it("retorna ref para client y branch", () => {
    expect(buildStopPrefillRefFromSearchItem(clientSearchItem)).toEqual({
      ownerType: "client",
      ownerId: "client-1",
      catalogAddressId: "client-addr-1",
    });
    expect(buildStopPrefillRefFromSearchItem({
      ...clientSearchItem,
      id: "branch-addr-1",
      ownerType: "branch",
      ownerId: "branch-1",
    })).toEqual({
      ownerType: "branch",
      ownerId: "branch-1",
      catalogAddressId: "branch-addr-1",
    });
    expect(buildStopPrefillRefFromSearchItem(partnerSearchItem)).toBeNull();
  });
});

describe("applyAddressPickerClearSlice", () => {
  it("limpia FK y campos de domicilio", () => {
    const slice = applyAddressPickerClearSlice();

    expect(slice.addressId).toBe("");
    expect(slice.clientAddressId).toBe("");
    expect(slice.clientId).toBe("");
    expect(slice.street).toBe("");
    expect(slice.latitude).toBeNull();
  });
});

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

  it("en snapshot mode no incluye addressId en el payload", () => {
    const w = {
      ...getEmptyStopDialogValues(),
      clientId: "",
      clientAddressId: "",
      addressId: "",
      street: "Av Editada",
      latitude: 25.2,
      longitude: -100.2,
      stopCategory: "waypoint" as const,
      stopType: ["delivery"] as ["delivery"],
    };
    const ref = {
      ownerType: "client" as const,
      ownerId: "client-1",
      catalogAddressId: catalogWithCoords.id,
    };

    const out = mergeDialogWithClientCatalog(
      w,
      catalogWithCoords,
      true,
      null,
      ref,
    );

    expect(out.addressId).toBeUndefined();
    expect(out.clientAddressId).toBeUndefined();
    expect(out.clientId).toBe("client-1");
    expect(out.street).toBe("Av Editada");
  });

  it("en snapshot mode branch no mezcla catálogo cliente", () => {
    const w = {
      ...getEmptyStopDialogValues(),
      street: "Av Sucursal",
      stopCategory: "origin" as const,
      stopType: ["pickup"] as ["pickup"],
    };

    const out = mergeDialogWithClientCatalog(
      w,
      catalogWithCoords,
      true,
      null,
      {
        ownerType: "branch",
        ownerId: "branch-1",
        catalogAddressId: "branch-addr-1",
      },
    );

    expect(out.street).toBe("Av Sucursal");
    expect(out.clientId).toBeUndefined();
  });
});

describe("shouldShowPrefillMissingGeolocationNotice", () => {
  it("no avisa si hay precarga tenant con coords en el formulario", () => {
    const form = {
      ...getEmptyStopDialogValues(),
      ...addressSearchItemToDialogSlice(partnerSearchItem),
    };
    const display = mergeDialogWithClientCatalog(form, undefined, false, null, null);

    expect(
      shouldShowPrefillMissingGeolocationNotice({
        hasAddressPrefill: true,
        latitude: display.latitude,
        longitude: display.longitude,
      }),
    ).toBe(false);
  });

  it("avisa si hay precarga sin coords efectivas", () => {
    expect(
      shouldShowPrefillMissingGeolocationNotice({
        hasAddressPrefill: true,
        latitude: null,
        longitude: null,
      }),
    ).toBe(true);
  });

  it("no avisa sin precarga aunque falten coords", () => {
    expect(
      shouldShowPrefillMissingGeolocationNotice({
        hasAddressPrefill: false,
        latitude: null,
        longitude: null,
      }),
    ).toBe(false);
  });
});
