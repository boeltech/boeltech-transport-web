import { describe, expect, it } from "vitest";

import { financeCopy } from "./financeCopy";

describe("financeCopy — orientación client", () => {
  it("página de facturas se titula Mis facturas y L1b distingue Borrador de Facturado", () => {
    expect(financeCopy.page.portal.title).toBe("Mis facturas");
    expect(financeCopy.page.clientOrientation.title).toMatch(/Borrador/i);
    expect(financeCopy.page.clientOrientation.title).toMatch(/Facturado/i);
    expect(financeCopy.page.clientOrientation.body).not.toMatch(
      /Timbrada|Nueva factura|Enviar|Cobrar/i,
    );
    expect(financeCopy.invoices.statusLabelsClient.stamped).toBe("Facturado");
    expect(financeCopy.invoices.statusLabelsClient.stamping).toBe("En proceso");
    expect(financeCopy.invoices.statusLabelsClient.draft).toBe("Borrador");
    expect(financeCopy.invoices.empty.noDataClient).not.toMatch(
      /Nueva factura/i,
    );
  });
});
