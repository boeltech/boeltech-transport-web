import { describe, expect, it } from "vitest";
import { financeCopy } from "../copy";
import { buildFinanceCycleSteps } from "./financeHubNav";

describe("buildFinanceCycleSteps", () => {
  it("omite pasos sin permiso y no incluye Cartera, Facturas ni Aprobaciones", () => {
    expect(
      buildFinanceCycleSteps({
        invoiceable: false,
        dispatch: false,
        cobros: true,
        operational: false,
      }).map((item) => item.id),
    ).toEqual(["cobros"]);

    expect(
      buildFinanceCycleSteps({
        invoiceable: false,
        dispatch: false,
        cobros: false,
        operational: false,
      }),
    ).toEqual([]);
  });

  it("ordena Por facturar → Envíos → Facturas a crédito → Cobros sin factura", () => {
    const items = buildFinanceCycleSteps(
      {
        invoiceable: true,
        dispatch: true,
        cobros: true,
        operational: true,
      },
      {
        invoiceable: 4,
        dispatch: 3,
        cobros: 7,
        cobrosBalance: 120_640,
        cobrosRepExceptions: 2,
        operational: 9,
        operationalBalance: 53_300,
      },
    );
    expect(items.map((item) => item.id)).toEqual([
      "invoiceable",
      "dispatch",
      "cobros",
      "operational",
    ]);
    expect(items.map((item) => item.label)).toEqual([
      financeCopy.page.hub.cycle.invoiceable.label,
      financeCopy.page.hub.cycle.dispatch.label,
      financeCopy.page.hub.cycle.cobros.label,
      financeCopy.page.hub.cycle.operational.label,
    ]);
    expect(items[0]?.countLabel).toBe("4 viajes");
    expect(items[2]?.hint).toMatch(/comprobantes por atender/i);
    expect(items.some((item) => item.href === "/finance")).toBe(false);
    expect(items.some((item) => item.href === "/finance/invoices")).toBe(false);
    expect(items.some((item) => item.href === "/finance/approvals")).toBe(
      false,
    );
  });
});
