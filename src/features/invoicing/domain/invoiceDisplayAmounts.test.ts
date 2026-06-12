import { describe, expect, it } from "vitest";
import {
  getDisplayAmountsFromInvoiceFields,
  getInvoiceDisplayAmounts,
} from "./invoiceDisplayAmounts";
import type { Invoice } from "./entities";

function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    serie: "A",
    folio: 100,
    cfdiUuid: "c9b54a4b-c44f-4fd6-afeb-a6889f4ad073",
    invoiceType: "ingreso",
    parentInvoiceId: null,
    issuerRfc: "AAA010101AAA",
    issuerName: "Emisor",
    issuerTaxRegime: "601",
    issueLocation: "26015",
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente",
    cfdiUsage: "G03",
    receiverTaxRegime: "616",
    receiverPostalCode: "26015",
    issuedAt: "2026-06-01T12:00:00.000Z",
    paymentForm: "03",
    paymentMethod: "PUE",
    currency: "MXN",
    exchangeRate: 1,
    subtotal: 1000,
    discount: 0,
    totalTax: 160,
    retainedTax: 0,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    satCancellationUpdatedAt: null,
    pacProvider: "profact",
    xmlContent: "<xml/>",
    hasStampedXml: true,
    qrCode: null,
    pdfUrl: null,
    stampedAt: "2026-06-01T12:05:00.000Z",
    cancelledAt: null,
    cancellationReason: null,
    cancellationCode: null,
    replacementCfdiUuid: null,
    notes: null,
    trips: [],
    payments: [],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T12:05:00.000Z",
    createdBy: "user-1",
    updatedBy: "user-1",
    createdByName: "Admin",
    updatedByName: "Admin",
    ...overrides,
  };
}

describe("invoiceDisplayAmounts", () => {
  it("shows stamped PUE as fully paid with zero balance", () => {
    const amounts = getInvoiceDisplayAmounts(buildInvoice());

    expect(amounts.balanceDue).toBe(0);
    expect(amounts.totalPaid).toBe(1160);
    expect(amounts.isPueSettled).toBe(true);
  });

  it("keeps PPD amounts based on recorded payments", () => {
    const amounts = getInvoiceDisplayAmounts(
      buildInvoice({
        paymentMethod: "PPD",
        totalPaid: 500,
        balanceDue: 660,
      }),
    );

    expect(amounts.balanceDue).toBe(660);
    expect(amounts.totalPaid).toBe(500);
    expect(amounts.isPueSettled).toBe(false);
  });

  it("supports partial field shapes for finance list items", () => {
    const amounts = getDisplayAmountsFromInvoiceFields({
      status: "stamped",
      paymentMethod: "PUE",
      total: 1160,
      totalPaid: 0,
    });

    expect(amounts.balanceDue).toBe(0);
    expect(amounts.totalPaid).toBe(1160);
  });
});
