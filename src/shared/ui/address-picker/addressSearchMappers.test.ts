import { describe, expect, it } from "vitest";
import { mapAddressSearchListItem, mapAddressSearchPage } from "./addressSearchMappers";

describe("addressSearchMappers", () => {
  it("maps camelCase API item to domain", () => {
    const item = mapAddressSearchListItem({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      ownerType: "tenant",
      ownerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      ownerLabel: "Transportes Norte",
      addressType: "warehouse",
      locationName: "Bodega Apodaca",
      street: "Av Industria",
      exteriorNumber: "120",
      postalCode: "66600",
      satStateCode: "19",
      satMunicipalityCode: "006",
      neighborhoodName: "Parque Industrial",
      satNeighborhoodCode: null,
      latitude: 25.78,
      longitude: -100.18,
      geolocationPending: false,
      isPrimary: false,
      isActive: true,
      isCartaPorteReady: true,
    });

    expect(item.ownerLabel).toBe("Transportes Norte");
    expect(item.isCartaPorteReady).toBe(true);
    expect(item.ownerType).toBe("tenant");
  });

  it("maps search page wrapper", () => {
    const page = mapAddressSearchPage(
      [
        {
          id: "1",
          ownerType: "client",
          ownerId: "2",
          ownerLabel: null,
          addressType: "shipping",
          locationName: null,
          street: "Calle",
          exteriorNumber: "1",
          postalCode: "44100",
          satStateCode: "JAL",
          satMunicipalityCode: "039",
          neighborhoodName: null,
          satNeighborhoodCode: null,
          latitude: null,
          longitude: null,
          geolocationPending: true,
          isPrimary: false,
          isActive: true,
          isCartaPorteReady: false,
        },
      ],
      { limit: 20, nextCursor: "cursor-1", hasMore: true },
    );

    expect(page.data).toHaveLength(1);
    expect(page.pagination.hasMore).toBe(true);
  });
});
