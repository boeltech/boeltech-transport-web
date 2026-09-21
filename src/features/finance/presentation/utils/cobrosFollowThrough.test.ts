import { describe, expect, it, afterEach } from "vitest";
import type { FinanceInvoiceListItem, FinancePayment } from "@features/finance/domain";
import {
  buildCobrosFollowThrough,
  clearCobrosFollowThrough,
  COBROS_FOLLOW_THROUGH_ABSENCE_GRACE_MS,
  COBROS_FOLLOW_THROUGH_STORAGE_KEY,
  parseCobrosFollowThrough,
  readCobrosFollowThrough,
  shouldClearCobrosFollowThrough,
  writeCobrosFollowThrough,
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
    totalPaid: 0,
    tripCodes: ["TRP-001"],
    status: "stamped",
  };
}

function buildPayment(overrides?: Partial<FinancePayment>): FinancePayment {
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
    ...overrides,
  };
}

const baseFollowThrough = {
  paymentId: "pay-1",
  receiverRfc: "XAXX010101000",
  amount: 1160,
  paymentDate: "2026-08-18",
  repStatus: "pending",
  invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
} as const;

describe("parseCobrosFollowThrough", () => {
  it("keeps a valid snapshot so the cobro lote survives leaving open-ppd", () => {
    const parsed = parseCobrosFollowThrough({
      ...baseFollowThrough,
      recordedAt: "2026-08-18T12:00:00.000Z",
    });

    expect(parsed?.invoices[0]?.id).toBe("inv-1");
    expect(parsed?.repStatus).toBe("pending");
    expect(parsed?.recordedAt).toBe("2026-08-18T12:00:00.000Z");
  });

  it("rejects empty or malformed snapshots", () => {
    expect(parseCobrosFollowThrough(null)).toBeNull();
    expect(
      parseCobrosFollowThrough({
        ...baseFollowThrough,
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
    expect(followThrough.recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("clearCobrosFollowThrough / sessionStorage", () => {
  afterEach(() => {
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
  });

  it("removes the snapshot so dismiss survives a tab refresh", () => {
    writeCobrosFollowThrough({
      ...baseFollowThrough,
      recordedAt: "2026-08-18T12:00:00.000Z",
    });
    expect(readCobrosFollowThrough()?.paymentId).toBe("pay-1");

    clearCobrosFollowThrough();

    expect(sessionStorage.getItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY)).toBeNull();
    expect(readCobrosFollowThrough()).toBeNull();
  });
});

describe("shouldClearCobrosFollowThrough", () => {
  it("clears when the snapshot already has stamped REP", () => {
    expect(
      shouldClearCobrosFollowThrough(
        { ...baseFollowThrough, repStatus: "stamped" },
        {
          exceptionsFetched: false,
          exceptionPaymentIds: [],
          previouslySeenInExceptions: false,
        },
      ),
    ).toBe(true);
  });

  it("keeps the banner while the payment is still in exceptions", () => {
    expect(
      shouldClearCobrosFollowThrough(baseFollowThrough, {
        exceptionsFetched: true,
        exceptionPaymentIds: ["pay-1", "pay-other"],
        previouslySeenInExceptions: true,
      }),
    ).toBe(false);
  });

  it("clears after the payment left exceptions once observed there", () => {
    expect(
      shouldClearCobrosFollowThrough(baseFollowThrough, {
        exceptionsFetched: true,
        exceptionPaymentIds: ["pay-other"],
        previouslySeenInExceptions: true,
      }),
    ).toBe(true);
  });

  it("does not clear on absence before the payment was ever seen (stale cache)", () => {
    expect(
      shouldClearCobrosFollowThrough(
        {
          ...baseFollowThrough,
          recordedAt: "2026-08-18T12:00:00.000Z",
        },
        {
          exceptionsFetched: true,
          exceptionPaymentIds: [],
          previouslySeenInExceptions: false,
          nowMs: Date.parse("2026-08-18T12:00:01.000Z"),
        },
      ),
    ).toBe(false);
  });

  it("clears on absence after grace when returning to Cobros post-stamp", () => {
    const recordedAt = "2026-08-18T12:00:00.000Z";
    expect(
      shouldClearCobrosFollowThrough(
        { ...baseFollowThrough, recordedAt },
        {
          exceptionsFetched: true,
          exceptionPaymentIds: [],
          previouslySeenInExceptions: false,
          nowMs:
            Date.parse(recordedAt) + COBROS_FOLLOW_THROUGH_ABSENCE_GRACE_MS,
        },
      ),
    ).toBe(true);
  });

  it("does not clear when the exceptions page may be incomplete", () => {
    expect(
      shouldClearCobrosFollowThrough(baseFollowThrough, {
        exceptionsFetched: true,
        exceptionPaymentIds: [],
        exceptionsMayBeIncomplete: true,
        previouslySeenInExceptions: true,
      }),
    ).toBe(false);
  });
});
