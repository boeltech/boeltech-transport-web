import { describe, expect, it } from "vitest";

import {
  getTripStopFiscalMissingLabels,
  validateTripStopFiscalFieldErrors,
} from "./tripStopAddressValidation";

describe("validateTripStopFiscalFieldErrors", () => {
  it("requires primary RFC and name for origin", () => {
    const errors = validateTripStopFiscalFieldErrors({
      stopCategory: "origin",
      stopType: ["origin", "pickup"],
      rfcRemitenteDestinatario: "",
      nombreRemitenteDestinatario: "",
    });
    expect(errors.rfcRemitenteDestinatario).toBeTruthy();
    expect(errors.nombreRemitenteDestinatario).toBeTruthy();
  });

  it("accepts valid primary fiscal for destination", () => {
    const errors = validateTripStopFiscalFieldErrors({
      stopCategory: "destination",
      stopType: ["destination", "delivery"],
      rfcRemitenteDestinatario: "XAXX010101000",
      nombreRemitenteDestinatario: "Destinatario SA",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("requires delivery fiscal for mixed waypoint", () => {
    const errors = validateTripStopFiscalFieldErrors({
      stopCategory: "waypoint",
      stopType: ["waypoint", "pickup", "delivery"],
      rfcRemitenteDestinatario: "XAXX010101000",
      nombreRemitenteDestinatario: "Remitente SA",
      deliveryRfcRemitenteDestinatario: "",
      deliveryNombreRemitenteDestinatario: "",
    });
    expect(errors.deliveryRfcRemitenteDestinatario).toBeTruthy();
    expect(errors.deliveryNombreRemitenteDestinatario).toBeTruthy();
  });

  it("maps missing fiscal fields to footer labels", () => {
    const labels = getTripStopFiscalMissingLabels({
      stopCategory: "origin",
      stopType: ["origin", "pickup"],
      rfcRemitenteDestinatario: "",
      nombreRemitenteDestinatario: "Nombre",
    });
    expect(labels).toContain("RFC remitente/destinatario");
  });
});
