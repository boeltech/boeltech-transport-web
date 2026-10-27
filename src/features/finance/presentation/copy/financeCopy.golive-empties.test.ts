import { describe, expect, it } from "vitest";

import { financeCopy } from "./financeCopy";

describe("financeCopy — vacíos greenfield go-live", () => {
  it("Facturas staff: empty orienta a viaje / Por facturar", () => {
    expect(financeCopy.invoices.newInvoiceCta.emptyDescription).toMatch(
      /Por facturar/i,
    );
    expect(financeCopy.invoices.newInvoiceCta.emptyDescription).toMatch(
      /viaje/i,
    );
    expect(financeCopy.invoices.fromTripCta.emptyDescription).toMatch(
      /Por facturar/i,
    );
  });

  it("Cobros open: empty aclara que es normal sin facturas PPD", () => {
    const description = financeCopy.cobros.workbench.emptyByBucket.open.description;
    expect(description).toMatch(/normal/i);
    expect(description).not.toMatch(/falló la carga|error al cargar/i);
    expect(description).toMatch(/PPD|crédito/i);
  });

  it("Por facturar staff: empty ready orienta a Viajes / reservar", () => {
    const ready =
      financeCopy.invoiceable.workbench.emptyByBucket.ready.description;
    expect(ready).toMatch(/Viajes/i);
    expect(ready).toMatch(/reserva/i);
    expect(ready).not.toMatch(/falló|roto/i);
    expect(financeCopy.invoiceable.empty.description).toMatch(/Viajes/i);
    expect(financeCopy.invoiceable.empty.accountantDescription).toMatch(
      /Atención fiscal/i,
    );
  });
});
