import { describe, expect, it } from "vitest";

import { buildTripBillingCobroSummary } from "./buildTripBillingCobroSummary";
import type { TripBillingInvoiceRow } from "./buildTripBillingInvoiceRows";

function row(
  overrides: Partial<TripBillingInvoiceRow> &
    Pick<TripBillingInvoiceRow, "id" | "countsInVigente">,
): TripBillingInvoiceRow {
  return {
    kind: "freight",
    title: "Flete",
    subtitle: "Cliente",
    status: "stamped",
    folio: "F-1",
    stampedAt: "2026-11-12T14:00:00Z",
    total: 0,
    collected: 0,
    balance: 0,
    sharePercent: null,
    shareAmount: null,
    clientRfc: null,
    isPrimaryClient: false,
    carriesCartaPorte: false,
    needsSubstitute: false,
    pendingCancel: false,
    isReplacedRow: false,
    isDraft: false,
    strikeTotal: false,
    showAmounts: true,
    href: "/invoices/x",
    invoicePortionHref: null,
    ...overrides,
  };
}

describe("buildTripBillingCobroSummary", () => {
  it("suma total/collected de filas countsInVigente (CFDI con IVA)", () => {
    const summary = buildTripBillingCobroSummary([
      row({
        id: "a",
        countsInVigente: true,
        total: 31920,
        collected: 10000,
        balance: 21920,
      }),
      row({
        id: "b",
        countsInVigente: true,
        total: 1740,
        collected: 1740,
        balance: 0,
      }),
      row({
        id: "draft",
        countsInVigente: false,
        status: "draft",
        isDraft: true,
        showAmounts: false,
        total: 9999,
        collected: null,
        balance: null,
      }),
    ]);

    expect(summary.facturado).toBe(31920 + 1740);
    expect(summary.cobrado).toBe(10000 + 1740);
    expect(summary.porCobrar).toBe(31920 + 1740 - 10000 - 1740);
    expect(summary.rowCount).toBe(2);
  });

  it("porCobrar no baja de 0 si cobrado supera facturado", () => {
    const summary = buildTripBillingCobroSummary([
      row({
        id: "a",
        countsInVigente: true,
        total: 1000,
        collected: 1500,
        balance: 0,
      }),
    ]);
    expect(summary.porCobrar).toBe(0);
  });

  it("sin vigentes → ceros", () => {
    expect(buildTripBillingCobroSummary([])).toEqual({
      facturado: 0,
      cobrado: 0,
      porCobrar: 0,
      rowCount: 0,
    });
  });
});
