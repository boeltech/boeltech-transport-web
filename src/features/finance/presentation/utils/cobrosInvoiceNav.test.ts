import { describe, expect, it } from "vitest";
import {
  folioLabel,
  invoicePaymentsHref,
  toInvoiceNavTargets,
} from "./cobrosInvoiceNav";

describe("cobrosInvoiceNav utils", () => {
  it("invoicePaymentsHref anchors to the payments section", () => {
    expect(invoicePaymentsHref("inv-1")).toBe(
      "/invoices/inv-1#invoice-payments",
    );
  });

  it("folioLabel joins serie and folio", () => {
    expect(folioLabel({ id: "inv-1", serie: "A", folio: 10 })).toBe("A-10");
  });

  it("toInvoiceNavTargets maps allocations ingressInvoiceId to id", () => {
    expect(
      toInvoiceNavTargets([
        { ingressInvoiceId: "inv-9", serie: "B", folio: 99 },
      ]),
    ).toEqual([{ id: "inv-9", serie: "B", folio: 99 }]);
  });
});
