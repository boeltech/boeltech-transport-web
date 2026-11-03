import { describe, expect, it } from "vitest";
import type { DispatchDocumentItem } from "@features/invoicing/domain";
import {
  dispatchDocumentSelectionKey,
  formatDispatchDocumentLabel,
  groupDispatchDocumentsForSend,
} from "./groupDispatchDocumentsForSend";

function makeDoc(
  overrides: Partial<DispatchDocumentItem> &
    Pick<DispatchDocumentItem, "id" | "documentKind" | "groupKey">,
): DispatchDocumentItem {
  return {
    clientId: "client-1",
    clientName: "Cliente Uno",
    receiverRfc: "AAA010101AAA",
    folioLabel: "A-1",
    amount: 1160,
    currency: "MXN",
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    ...overrides,
  };
}

describe("groupDispatchDocumentsForSend", () => {
  it("groups by API groupKey and picks sample invoice/payment", () => {
    const docs = [
      makeDoc({
        id: "inv-1",
        documentKind: "invoice",
        groupKey: "client-1",
        folioLabel: "A-1",
      }),
      makeDoc({
        id: "pay-1",
        documentKind: "rep",
        groupKey: "client-1",
        folioLabel: "REP-abcdef12",
        amount: 500,
      }),
      makeDoc({
        id: "inv-2",
        documentKind: "invoice",
        groupKey: "client-2",
        clientId: "client-2",
        clientName: "Dos",
        receiverRfc: "BBB010101BBB",
        folioLabel: "B-2",
      }),
    ];

    const groups = groupDispatchDocumentsForSend(docs);
    expect(groups).toHaveLength(2);

    const mixed = groups.find((g) => g.groupKey === "client-1")!;
    expect(mixed.documents).toHaveLength(2);
    expect(mixed.sampleInvoiceId).toBe("inv-1");
    expect(mixed.samplePaymentId).toBe("pay-1");

    const onlyInvoice = groups.find((g) => g.groupKey === "client-2")!;
    expect(onlyInvoice.sampleInvoiceId).toBe("inv-2");
    expect(onlyInvoice.samplePaymentId).toBeNull();
  });

  it("uses payment sample when group is REP-only", () => {
    const groups = groupDispatchDocumentsForSend([
      makeDoc({
        id: "pay-9",
        documentKind: "rep",
        groupKey: "rfc:AAA010101AAA",
        clientId: null,
        folioLabel: "REP-zzzzzzzz",
      }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.sampleInvoiceId).toBeNull();
    expect(groups[0]!.samplePaymentId).toBe("pay-9");
  });
});

describe("formatDispatchDocumentLabel", () => {
  it("uses D12 naming for REP", () => {
    expect(
      formatDispatchDocumentLabel({
        documentKind: "rep",
        folioLabel: "REP-abcdef12",
      }),
    ).toBe("Comprobante de pago (REP) · REP-abcdef12");
  });

  it("returns folio for invoices", () => {
    expect(
      formatDispatchDocumentLabel({
        documentKind: "invoice",
        folioLabel: "A-10",
      }),
    ).toBe("A-10");
  });
});

describe("dispatchDocumentSelectionKey", () => {
  it("namespaces by kind", () => {
    expect(
      dispatchDocumentSelectionKey({ documentKind: "invoice", id: "x" }),
    ).toBe("invoice:x");
    expect(
      dispatchDocumentSelectionKey({ documentKind: "rep", id: "x" }),
    ).toBe("rep:x");
  });
});
