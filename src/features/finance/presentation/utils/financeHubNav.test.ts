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
      }).map((item) => item.id),
    ).toEqual(["cobros"]);

    expect(
      buildFinanceCycleSteps({
        invoiceable: false,
        dispatch: false,
        cobros: false,
      }),
    ).toEqual([]);
  });

  it("ordena emitir → enviar → cobrar", () => {
    const items = buildFinanceCycleSteps({
      invoiceable: true,
      dispatch: true,
      cobros: true,
    });
    expect(items.map((item) => item.id)).toEqual([
      "invoiceable",
      "dispatch",
      "cobros",
    ]);
    expect(items.map((item) => item.label)).toEqual([
      financeCopy.page.hub.cycle.invoiceable.label,
      financeCopy.page.hub.cycle.dispatch.label,
      financeCopy.page.hub.cycle.cobros.label,
    ]);
    expect(items.map((item) => item.verb)).toEqual(["Emitir", "Enviar", "Cobrar"]);
    expect(financeCopy.page.hub.cycle.dispatch.hint).toBe(
      "Mandar facturas por correo.",
    );
    expect(items.some((item) => item.href === "/finance")).toBe(false);
    expect(items.some((item) => item.href === "/finance/invoices")).toBe(false);
    expect(items.some((item) => item.href === "/finance/approvals")).toBe(
      false,
    );
  });
});
