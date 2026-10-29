import { describe, expect, it } from "vitest";

import {
  resolveStopFiscalUiContext,
  stopRfcNotClientOrCompanyNotice,
  ubicacionRfcSatNotice,
} from "./fiscalCopy";

describe("resolveStopFiscalUiContext", () => {
  it("does not assume pickup when waypoint has no operation", () => {
    expect(resolveStopFiscalUiContext("waypoint", ["waypoint"])).toBe(
      "waypoint_pending_operation",
    );
    expect(resolveStopFiscalUiContext("waypoint", [])).toBe(
      "waypoint_pending_operation",
    );
  });

  it("maps pickup / delivery / both", () => {
    expect(
      resolveStopFiscalUiContext("waypoint", ["waypoint", "pickup"]),
    ).toBe("waypoint_pickup_only");
    expect(
      resolveStopFiscalUiContext("waypoint", ["waypoint", "delivery"]),
    ).toBe("waypoint_delivery_only");
    expect(
      resolveStopFiscalUiContext("waypoint", [
        "waypoint",
        "pickup",
        "delivery",
      ]),
    ).toBe("waypoint_pickup_and_delivery");
  });
});

describe("avisos del RFC de la ubicación", () => {
  it("fija la frase de inscripción y la de que no es el RFC del cliente", () => {
    expect(ubicacionRfcSatNotice()).toBe(
      "RFC inscrito y vigente ante el SAT. Va en la Carta Porte; si no está registrado, el timbrado no pasa.",
    );
    expect(stopRfcNotClientOrCompanyNotice()).toBe(
      "No es el RFC del cliente de la factura ni el de tu empresa, salvo que sea la misma persona.",
    );
  });
});
