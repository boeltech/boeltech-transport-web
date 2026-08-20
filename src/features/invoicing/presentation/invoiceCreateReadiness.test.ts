import { describe, expect, it } from "vitest";
import { defaultInvoiceFormValues } from "./validation/invoiceFormSchema";
import { getInvoiceCreateReadiness } from "./invoiceCreateReadiness";

describe("getInvoiceCreateReadiness", () => {
  it("marks receptor and total pending on empty defaults (concept row exists)", () => {
    const readiness = getInvoiceCreateReadiness(defaultInvoiceFormValues());
    expect(readiness.receiverOk).toBe(false);
    expect(readiness.conceptsOk).toBe(true);
    expect(readiness.totalOk).toBe(false);
    expect(readiness.allOk).toBe(false);
  });

  it("marks allOk when receptor, concepts and total are present", () => {
    const readiness = getInvoiceCreateReadiness({
      ...defaultInvoiceFormValues(),
      receiver_name: "Cliente SA",
      receiver_rfc: "AAA010101AAA",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      cfdi_usage: "S01",
      payment_form: "99",
      payment_method: "PPD",
      concepts: [
        {
          ...defaultInvoiceFormValues().concepts[0],
          amount: 1000,
        },
      ],
      total: 1160,
    });

    expect(readiness.allOk).toBe(true);
    expect(readiness.receiverOk).toBe(true);
    expect(readiness.conceptsOk).toBe(true);
    expect(readiness.totalOk).toBe(true);
  });
});
