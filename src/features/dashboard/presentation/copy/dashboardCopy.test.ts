import { describe, expect, it } from "vitest";

import { dashboardCopy } from "./dashboardCopy";

describe("dashboardCopy.page", () => {
  it("subtitle staff es operativo, sin margen ni cobranza", () => {
    expect(dashboardCopy.page.subtitle).toMatch(/operación/i);
    expect(dashboardCopy.page.subtitle).toMatch(/alertas/i);
    expect(dashboardCopy.page.subtitle).not.toMatch(/margen/i);
    expect(dashboardCopy.page.subtitle).not.toMatch(/cobranza/i);
  });

  it("puente de una línea a Viajes", () => {
    expect(dashboardCopy.page.tripsBridge).toMatch(/Viajes/);
    expect(dashboardCopy.page.tripsBridgeLink).toBe("Ir a Viajes");
  });

  it("accountant: subtitle fiscal/cobro y puente a Por facturar, no el operativo", () => {
    expect(dashboardCopy.page.subtitleAccountant).toMatch(/facturación/i);
    expect(dashboardCopy.page.subtitleAccountant).not.toBe(
      dashboardCopy.page.subtitle,
    );
    expect(dashboardCopy.page.invoiceableBridge).toMatch(/Por facturar/i);
    expect(dashboardCopy.page.invoiceableBridgeLink).toBe("Ir a Por facturar");
    expect(dashboardCopy.page.subtitle).toMatch(/operación/i);
  });

  it("admin: subtitle armar empresa y dos puentes, sin tripsBridge ni hermanos", () => {
    expect(dashboardCopy.page.subtitleAdmin).toMatch(/usuarios/i);
    expect(dashboardCopy.page.subtitleAdmin).toMatch(/facturar/i);
    expect(dashboardCopy.page.subtitleAdmin).not.toBe(
      dashboardCopy.page.subtitle,
    );
    expect(dashboardCopy.page.subtitleAdmin).not.toMatch(
      /el trabajo del día está en Viajes/i,
    );
    expect(dashboardCopy.page.usersBridge).toMatch(/Usuarios/i);
    expect(dashboardCopy.page.usersBridgeLink).toBe("Ir a Usuarios");
    expect(dashboardCopy.page.billingBridge).toMatch(/Datos para facturar/i);
    expect(dashboardCopy.page.billingBridgeLink).toBe(
      "Ir a Datos para facturar",
    );
    expect(dashboardCopy.page.usersBridge).not.toMatch(
      /Viajes|Por facturar|Atención fiscal|SAT/i,
    );
    expect(dashboardCopy.page.billingBridge).not.toMatch(
      /Viajes|Por facturar|Atención fiscal|Stripe/i,
    );
  });

  it("manager: subtitle SAT+altas y un link a Atención fiscal, sin tripsBridge", () => {
    expect(dashboardCopy.page.subtitleManager).toMatch(/SAT/i);
    expect(dashboardCopy.page.subtitleManager).toMatch(/altas/i);
    expect(dashboardCopy.page.subtitleManager).not.toBe(
      dashboardCopy.page.subtitle,
    );
    expect(dashboardCopy.page.subtitleManager).not.toMatch(
      /el trabajo del día está en Viajes/i,
    );
    expect(dashboardCopy.page.fiscalAttentionBridge).toMatch(
      /Atención fiscal/i,
    );
    expect(dashboardCopy.page.fiscalAttentionBridgeLink).toBe(
      "Ir a Atención fiscal",
    );
    expect(dashboardCopy.page.tripsBridge).toMatch(/Viajes/);
  });

  it("operator: subtitle de gastos y puente a Viajes + Costos", () => {
    expect(dashboardCopy.page.subtitleOperator).toMatch(
      /casetas|combustible|extras/i,
    );
    expect(dashboardCopy.page.subtitleOperator).not.toBe(
      dashboardCopy.page.subtitle,
    );
    expect(dashboardCopy.page.subtitleOperator).not.toMatch(
      /el trabajo del día está en Viajes/i,
    );
    expect(dashboardCopy.page.subtitleOperator).not.toMatch(
      /facturación|SAT|Por facturar/i,
    );
    expect(dashboardCopy.page.tripsBridgeOperator).toMatch(/Viajes/i);
    expect(dashboardCopy.page.tripsBridgeOperator).toMatch(/\bCostos\b/);
    expect(dashboardCopy.page.tripsBridgeOperator).not.toBe(
      dashboardCopy.page.tripsBridge,
    );
    expect(dashboardCopy.page.tripsBridgeOperatorLink).toBe("Ir a Viajes");
  });

  it("no reescribe copy de portales", () => {
    expect(dashboardCopy.page.subtitleClient).toMatch(/envíos/i);
    expect(dashboardCopy.page.subtitleClient).not.toMatch(/margen/i);
  });

  it("client: subtitle sin widgets + dos puentes a Mis envíos y Mis facturas", () => {
    expect(dashboardCopy.page.subtitleClient).not.toMatch(/recientes/i);
    expect(dashboardCopy.page.subtitleClient).toMatch(/facturas/i);
    expect(dashboardCopy.page.tripsBridgeClient).toMatch(/Mis envíos/i);
    expect(dashboardCopy.page.tripsBridgeClientLink).toBe("Ir a Mis envíos");
    expect(dashboardCopy.page.invoicesBridgeClient).toMatch(/Mis facturas/i);
    expect(dashboardCopy.page.invoicesBridgeClientLink).toBe(
      "Ir a Mis facturas",
    );
    expect(dashboardCopy.page.tripsBridgeClient).not.toBe(
      dashboardCopy.page.tripsBridge,
    );
    expect(dashboardCopy.page.tripsBridgeClient).not.toBe(
      dashboardCopy.page.tripsBridgeDriver,
    );
  });

  it("driver: subtitle + puente propio a Mis viajes, no reusa staff", () => {
    expect(dashboardCopy.page.subtitleDriver).toMatch(/Mis viajes/i);
    expect(dashboardCopy.page.subtitleDriver).not.toBe(
      dashboardCopy.page.subtitle,
    );
    expect(dashboardCopy.page.subtitleDriver).not.toMatch(/recientes y por día/i);
    expect(dashboardCopy.page.subtitleDriver).not.toMatch(/margen/i);
    expect(dashboardCopy.page.tripsBridgeDriver).toMatch(/Mis viajes/i);
    expect(dashboardCopy.page.tripsBridgeDriver).not.toBe(
      dashboardCopy.page.tripsBridge,
    );
    expect(dashboardCopy.page.tripsBridgeDriver).not.toBe(
      dashboardCopy.page.tripsBridgeOperator,
    );
    expect(dashboardCopy.page.tripsBridgeDriver).not.toMatch(
      /Dinero del viaje|\bCostos\b|el trabajo del día/i,
    );
    expect(dashboardCopy.page.tripsBridgeDriverLink).toBe("Ir a Mis viajes");
  });
});

describe("dashboardCopy.customize", () => {
  it("usa Inicio en el copy visible de personalizar", () => {
    expect(dashboardCopy.customize.title).toBe("Personalizar Inicio");
    expect(dashboardCopy.customize.description).toMatch(/Inicio/);
    expect(dashboardCopy.customize.roleSettingsTitle).toMatch(/Inicio/);
  });
});
