import { createTripStopAddressSchema } from "@boeltech/cfdi-domain/validadores/address";
import { describe, expect, it } from "vitest";

import { addressSearchItemToTripStopAddress } from "./addressSearchItemToTripStopAddress";
import type { AddressSearchListItem } from "./types";

const partnerItem: AddressSearchListItem = {
  id: "22222222-2222-4222-8222-222222222222",
  ownerType: "tenant",
  ownerId: "pppppppp-pppp-4ppp-8ppp-pppppppppppp",
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

describe("addressSearchItemToTripStopAddress", () => {
  it("maps to snake_case trip_stop payload without source ids", () => {
    const payload = addressSearchItemToTripStopAddress(partnerItem);

    expect(payload).toMatchObject({
      address_type: "trip_stop",
      sat_country_code: "MEX",
      sat_state_code: "19",
      sat_municipality_code: "006",
      postal_code: "66600",
      street: "Av Industria",
      exterior_number: "120",
      location_name: "Bodega Apodaca",
      latitude: 25.78,
      longitude: -100.18,
    });
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("owner_type");
    expect(payload).not.toHaveProperty("owner_id");
  });

  it("passes createTripStopAddressSchema validation", () => {
    const payload = addressSearchItemToTripStopAddress(partnerItem);
    const parsed = createTripStopAddressSchema.safeParse(payload);

    expect(parsed.success).toBe(true);
  });

  it("copies remitente_rfc and nombre when source has fiscal metadata", () => {
    const billingItem: AddressSearchListItem = {
      ...partnerItem,
      addressType: "billing",
      locationName: "Domicilio fiscal",
      remitenteRfc: "AAA010101AAA",
      remitenteName: "Cliente Demo SA",
    };

    const payload = addressSearchItemToTripStopAddress(billingItem);

    expect(payload.rfc_remitente_destinatario).toBe("AAA010101AAA");
    expect(payload.nombre_remitente_destinatario).toBe("Cliente Demo SA");
  });
});
