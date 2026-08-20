import { describe, expect, it } from "vitest";
import type { FinanceInvoiceListItem, FinancePayment } from "@features/finance/domain";
import {
  buildCobrosFollowThrough,
  parseCobrosFollowThrough,
} from "./cobrosFollowThrough";

function buildInvoice(): FinanceInvoiceListItem {
  return {
    id: "inv-1",
    serie: "A",
    folio: 10,
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente Demo",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentMethod: "PPD",
    total: 1160,
    balanceDue: 1160,
    tripCodes: ["TRP-001"],
    status: "stamped",
  };
}

function buildPayment(): FinancePayment {
  return {
    id: "pay-1",
    invoiceId: "inv-1",
    amount: 1160,
    currency: "MXN",
    exchangeRate: 1,
    amountMxn: 1160,
    paymentDate: "2026-08-18",
    paymentTime: "12:00:00",
    paymentForm: "03",
    paymentFormName: null,
    reference: null,
    notes: null,
    createdAt: "2026-08-18T12:00:00.000Z",
    createdByName: null,
    repCfdiUuid: null,
    repStampedAt: null,
    repStatus: "pending",
    repAttempts: 0,
    repLastError: null,
    hasRepXml: false,
    repNumParcialidad: null,
    repImpSaldoAnt: null,
    repImpSaldoInsoluto: null,
    repImpPagado: null,
  };
}

describe("parseCobrosFollowThrough", () => {
  it("keeps a valid snapshot so the cobro lote survives leaving open-ppd", () => {
    const parsed = parseCobrosFollowThrough({
      paymentId: "pay-1",
      receiverRfc: "XAXX010101000",
      amount: 1160,
      paymentDate: "2026-08-18",
      repStatus: "pending",
      invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
    });

    expect(parsed?.invoices[0]?.id).toBe("inv-1");
    expect(parsed?.repStatus).toBe("pending");
  });

  it("rejects empty or malformed snapshots", () => {
    expect(parseCobrosFollowThrough(null)).toBeNull();
    expect(
      parseCobrosFollowThrough({
        paymentId: "pay-1",
        receiverRfc: "XAXX010101000",
        amount: 1160,
        paymentDate: "2026-08-18",
        repStatus: "pending",
        invoices: [],
      }),
    ).toBeNull();
  });
});

describe("buildCobrosFollowThrough", () => {
  it("maps allocations to invoice folios from the confirmed lote", () => {
    const invoice = buildInvoice();
    const followThrough = buildCobrosFollowThrough(
      buildPayment(),
      {
        receiverRfc: "XAXX010101000",
        amount: 1160,
        paymentDate: "2026-08-18",
        paymentForm: "03",
        allocations: [{ ingressInvoiceId: "inv-1", amount: 1160 }],
      },
      [invoice],
    );

    expect(followThrough.invoices).toEqual([
      { id: "inv-1", serie: "A", folio: 10, amount: 1160 },
    ]);
  });
});
