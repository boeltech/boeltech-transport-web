import { describe, expect, it } from "vitest";

import {
  clientAddressFormDataToUpdateDto,
  type ClientAddressFormData,
} from "./clientAddressSchema";

const baseAddress: ClientAddressFormData = {
  addressType: "shipping",
  isPrimary: false,
  locationName: "CEDIS Norte",
  street: "Av. Test",
  exteriorNumber: "100",
  interiorNumber: "Int. 2",
  reference: "Portón azul",
  postalCode: "44100",
  satCountryCode: "MEX",
  satStateCode: "JAL",
  satMunicipalityCode: "039",
  satLocalityCode: "01",
  localityName: "Guadalajara",
  satNeighborhoodCode: "0001",
  neighborhoodName: "Centro",
  latitude: 20.67,
  longitude: -103.34,
  rfcRemitenteDestinatario: "XAXX010101000",
  nombreRemitenteDestinatario: "ACME SA",
  contactName: "Juan",
  contactPhone: "3312345678",
  contactEmail: "juan@example.com",
  businessHours: "9 a 18",
  notes: "Notas",
  specialInstructions: "Instrucciones",
};

describe("clientAddressFormDataToUpdateDto", () => {
  it("envía limpiezas explícitas para campos opcionales editados a vacío", () => {
    const dto = clientAddressFormDataToUpdateDto(
      {
        ...baseAddress,
        street: "",
        exteriorNumber: "",
        interiorNumber: "",
        reference: "",
        satMunicipalityCode: "",
        satLocalityCode: "",
        localityName: "",
        satNeighborhoodCode: "",
        neighborhoodName: "",
      },
      { context: "additional" },
    );

    expect(dto).toMatchObject({
      street: "",
      exteriorNumber: "",
      interiorNumber: null,
      reference: null,
      satMunicipalityCode: null,
      satLocalityCode: null,
      localityName: null,
      satNeighborhoodCode: null,
      neighborhoodName: null,
    });
  });
});
