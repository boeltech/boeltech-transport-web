import { describe, expect, it } from "vitest";
import type { InvoiceListItem } from "@features/invoicing/domain";
import {
  groupInvoicesForDispatch,
  invoiceFolioLabel,
} from "./groupInvoicesForDispatch";

function makeInvoice(
  overrides: Partial<InvoiceListItem> & Pick<InvoiceListItem, "id">,
): InvoiceListItem {
  return {
    tenantId: "t1",
    serie: "A",
    folio: 1,
    cfdiUuid: null,
    receiverRfc: "AAA010101AAA",
    receiverName: "Receptor",
    clientId: "client-1",
    clientName: "Cliente Uno",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentForm: "03",
    paymentMethod: "PPD",
    currency: "MXN",
    subtotal: 1000,
    totalTax: 160,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    tripCount: 0,
    tripCodes: [],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-08-01T12:00:00.000Z",
    createdByName: null,
    ...overrides,
  };
}

describe("groupInvoicesForDispatch", () => {
  it("groups by clientId when present", () => {
    const invoices = [
      makeInvoice({ id: "inv-1", clientId: "c1", folio: 1 }),
      makeInvoice({ id: "inv-2", clientId: "c2", clientName: "Dos", folio: 2 }),
      makeInvoice({ id: "inv-3", clientId: "c1", folio: 3 }),
    ];

    const groups = groupInvoicesForDispatch(invoices);

    expect(groups).toHaveLength(2);
    expect(groups[0]!.groupKey).toBe("c1");
    expect(groups[0]!.invoices.map((i) => i.id)).toEqual(["inv-1", "inv-3"]);
    expect(groups[0]!.sampleInvoiceId).toBe("inv-1");
    expect(groups[1]!.groupKey).toBe("c2");
    expect(groups[1]!.clientName).toBe("Receptor");
  });

  it("splits the same clientId when receiverRfc differs (defense D2)", () => {
    const invoices = [
      makeInvoice({
        id: "inv-leg-a",
        clientId: "viaje-1",
        clientName: "Cliente del viaje",
        receiverRfc: "aaa010101aaa",
        receiverName: "Pierna Uno SA",
        folio: 1,
      }),
      makeInvoice({
        id: "inv-leg-b",
        clientId: "viaje-1",
        clientName: "Cliente del viaje",
        receiverRfc: "BBB010101BBB",
        receiverName: "Pierna Dos SA",
        folio: 2,
      }),
    ];

    const groups = groupInvoicesForDispatch(invoices);

    expect(groups).toHaveLength(2);
    expect(groups[0]!.groupKey).toBe("viaje-1:AAA010101AAA");
    expect(groups[0]!.clientName).toBe("Pierna Uno SA");
    expect(groups[0]!.invoices.map((i) => i.id)).toEqual(["inv-leg-a"]);
    expect(groups[1]!.groupKey).toBe("viaje-1:BBB010101BBB");
    expect(groups[1]!.clientName).toBe("Pierna Dos SA");
    expect(groups[1]!.invoices.map((i) => i.id)).toEqual(["inv-leg-b"]);
  });

  it("keeps one group when the same clientId has the same RFC ignoring case", () => {
    const invoices = [
      makeInvoice({
        id: "inv-1",
        clientId: "c1",
        receiverRfc: "aaa010101aaa",
        folio: 1,
      }),
      makeInvoice({
        id: "inv-2",
        clientId: "c1",
        receiverRfc: "AAA010101AAA",
        folio: 2,
      }),
    ];

    const groups = groupInvoicesForDispatch(invoices);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.groupKey).toBe("c1");
    expect(groups[0]!.invoices.map((i) => i.id)).toEqual(["inv-1", "inv-2"]);
  });

  it("falls back to receiverRfc when clientId is null", () => {
    const invoices = [
      makeInvoice({
        id: "inv-a",
        clientId: null,
        clientName: null,
        receiverRfc: "BBB010101BBB",
        receiverName: "Sin cliente",
        folio: 10,
      }),
      makeInvoice({
        id: "inv-b",
        clientId: null,
        clientName: null,
        receiverRfc: "BBB010101BBB",
        receiverName: "Sin cliente",
        folio: 11,
      }),
      makeInvoice({
        id: "inv-c",
        clientId: null,
        clientName: null,
        receiverRfc: "CCC010101CCC",
        folio: 12,
      }),
    ];

    const groups = groupInvoicesForDispatch(invoices);

    expect(groups).toHaveLength(2);
    expect(groups[0]!.groupKey).toBe("rfc:BBB010101BBB");
    expect(groups[0]!.clientId).toBeNull();
    expect(groups[0]!.invoices).toHaveLength(2);
    expect(groups[1]!.groupKey).toBe("rfc:CCC010101CCC");
  });

  it("does not mix clientId groups with rfc fallback of the same RFC", () => {
    const invoices = [
      makeInvoice({
        id: "inv-linked",
        clientId: "c1",
        receiverRfc: "AAA010101AAA",
      }),
      makeInvoice({
        id: "inv-orphan",
        clientId: null,
        clientName: null,
        receiverRfc: "AAA010101AAA",
      }),
    ];

    const groups = groupInvoicesForDispatch(invoices);
    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.groupKey)).toEqual([
      "c1",
      "rfc:AAA010101AAA",
    ]);
  });
});

describe("invoiceFolioLabel", () => {
  it("formats serie-folio", () => {
    expect(
      invoiceFolioLabel(makeInvoice({ id: "x", serie: "B", folio: 42 })),
    ).toBe("B-42");
  });
});
