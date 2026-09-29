import { describe, expect, it } from "vitest";
import { financeCopy } from "../copy";
import { buildFinanceCycleSteps } from "./financeHubNav";

describe("buildFinanceCycleSteps", () => {
  it("omite pasos sin permiso y no incluye Cartera ni Facturas", () => {
    expect(
      buildFinanceCycleSteps({
        invoiceable: false,
        dispatch: false,
        cobros: false,
        approvals: true,
      }).map((item) => item.id),
    ).toEqual(["approvals"]);
  });

  it("ordena emitir → enviar → cobrar → aprobar", () => {
    const items = buildFinanceCycleSteps({
      invoiceable: true,
      dispatch: true,
      cobros: true,
      approvals: true,
    });
    expect(items.map((item) => item.id)).toEqual([
      "invoiceable",
      "dispatch",
      "cobros",
      "approvals",
    ]);
    expect(items.map((item) => item.label)).toEqual([
      financeCopy.page.hub.cycle.invoiceable.label,
      financeCopy.page.hub.cycle.dispatch.label,
      financeCopy.page.hub.cycle.cobros.label,
      financeCopy.page.hub.cycle.approvals.label,
    ]);
    expect(financeCopy.page.hub.cycle.dispatch.hint).toBe(
      "Mandar facturas por correo.",
    );
    expect(items.some((item) => item.href === "/finance")).toBe(false);
    expect(items.some((item) => item.href === "/finance/invoices")).toBe(false);
  });
});
