import { describe, expect, it } from "vitest";
import { resolveAddressFormNotice } from "./addressFormNoticeRules";

describe("resolveAddressFormNotice", () => {
  it("no muestra banner de error por campos SAT vacíos (errores van al campo)", () => {
    const notice = resolveAddressFormNotice(
      {
        context: "billingOnCreate",
        addressVariant: "carta-porte",
        addressType: "billing",
        satStateCode: "",
        postalCode: "",
        satMunicipalityCode: "",
      },
      "",
    );
    expect(notice).toBeNull();
  });

  it("no duplica aviso de municipio recomendado (label + FieldInlineError en AddressInput)", () => {
    const notice = resolveAddressFormNotice(
      {
        context: "billingOnCreate",
        addressVariant: "carta-porte",
        addressType: "billing",
        satStateCode: "JAL",
        postalCode: "44100",
        satMunicipalityCode: "",
      },
      "",
    );
    expect(notice).toBeNull();
  });

  it("muestra solo el copy de contexto del formulario padre", () => {
    const notice = resolveAddressFormNotice(
      {
        context: "tripStop",
        addressVariant: "carta-porte",
        addressType: "trip_stop",
        satStateCode: "19",
        postalCode: "64000",
        satMunicipalityCode: "039",
      },
      "Ubicación de la parada para Carta Porte.",
    );
    expect(notice).toEqual({
      level: "info",
      message: "Ubicación de la parada para Carta Porte.",
    });
  });
});
