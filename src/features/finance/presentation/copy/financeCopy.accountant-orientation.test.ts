import { describe, expect, it } from "vitest";

import { financeCopy } from "./financeCopy";

describe("financeCopy — orientación accountant", () => {
  it("Por facturar: receptor del primer CFDI y bloqueados = patio", () => {
    expect(financeCopy.invoiceable.descriptionAccountant).toMatch(/primer CFDI/i);
    expect(financeCopy.invoiceable.descriptionAccountant).toMatch(
      /Atención fiscal/i,
    );
    expect(financeCopy.invoiceable.empty.accountantDescription).toMatch(
      /Atención fiscal/i,
    );
    expect(
      financeCopy.invoiceable.workbench.bucketDescriptions.blockedAccountant,
    ).toMatch(/pide a operación/i);
    expect(
      financeCopy.invoiceable.workbench.bucketDescriptions.blockedAccountant,
    ).not.toMatch(/completa ruta/i);
    expect(financeCopy.invoiceable.workbench.bucketDescriptions.blocked).toMatch(
      /Completa ruta/i,
    );
  });

  it("Cartera accountant no enseña Aprobar ni liquidaciones como siguiente", () => {
    expect(financeCopy.page.hub.orientationAccountant).toMatch(/saldos/i);
    expect(financeCopy.page.hub.orientationAccountant).toMatch(/Por facturar/i);
    expect(financeCopy.page.hub.orientationAccountant).not.toMatch(
      /Aprobar|Liquidaciones|nómina|SaaS/i,
    );
  });

  it("Cartera manager es saldos, sin Aprobar ni liquidaciones", () => {
    expect(financeCopy.page.hub.orientationManager).toMatch(/saldos/i);
    expect(financeCopy.page.hub.orientationManager).not.toMatch(
      /Aprobar|Liquidaciones|nómina|SaaS/i,
    );
    expect(financeCopy.page.hub.orientationManager).not.toBe(
      financeCopy.page.hub.orientationAccountant,
    );
  });
});
