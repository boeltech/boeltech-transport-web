import { describe, expect, it, afterEach } from "vitest";
import type { FinanceInvoiceListItem, FinancePayment } from "@features/finance/domain";
import {
  appendCobrosTodayEntry,
  buildCobrosFollowThrough,
  clearCobrosTodayTray,
  COBROS_FOLLOW_THROUGH_ABSENCE_GRACE_MS,
  COBROS_FOLLOW_THROUGH_STORAGE_KEY,
  COBROS_TODAY_TRAY_STORAGE_KEY,
  parseCobrosFollowThrough,
  readCobrosTodayTray,
  shouldClearCobrosFollowThrough,
  writeCobrosTodayTray,
  type CobrosTodayEntry,
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
    dispatchSentAt: null,
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

const baseEntry: CobrosTodayEntry = {
  paymentId: "pay-1",
  receiverRfc: "XAXX010101000",
  amount: 1160,
  paymentDate: "2026-08-18",
  repStatus: "pending",
  invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
  recordedAt: "2026-08-18T12:00:00.000Z",
};

describe("parseCobrosFollowThrough", () => {
  it("keeps a valid snapshot so the cobro lote survives leaving open-ppd", () => {
    const parsed = parseCobrosFollowThrough(baseEntry);

    expect(parsed?.invoices[0]?.id).toBe("inv-1");
    expect(parsed?.repStatus).toBe("pending");
    expect(parsed?.recordedAt).toBe("2026-08-18T12:00:00.000Z");
  });

  it("rejects empty or malformed snapshots", () => {
    expect(parseCobrosFollowThrough(null)).toBeNull();
    expect(
      parseCobrosFollowThrough({
        ...baseEntry,
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

describe("cobros today tray sessionStorage v2", () => {
  afterEach(() => {
    sessionStorage.removeItem(COBROS_TODAY_TRAY_STORAGE_KEY);
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
  });

  it("appends multiple cobros without overwriting the previous one", () => {
    const first = appendCobrosTodayEntry([], baseEntry);
    const second = appendCobrosTodayEntry(first, {
      ...baseEntry,
      paymentId: "pay-2",
      amount: 2000,
      recordedAt: "2026-08-18T12:01:00.000Z",
    });

    expect(second.map((e) => e.paymentId)).toEqual(["pay-2", "pay-1"]);
    expect(readCobrosTodayTray().map((e) => e.paymentId)).toEqual([
      "pay-2",
      "pay-1",
    ]);
  });

  it("migrates v1 follow-through into the v2 tray", () => {
    sessionStorage.setItem(
      COBROS_FOLLOW_THROUGH_STORAGE_KEY,
      JSON.stringify(baseEntry),
    );

    const tray = readCobrosTodayTray();
    expect(tray).toHaveLength(1);
    expect(tray[0]?.paymentId).toBe("pay-1");
    expect(sessionStorage.getItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(COBROS_TODAY_TRAY_STORAGE_KEY)).not.toBeNull();
  });

  it("clears the tray and legacy key on dismiss", () => {
    writeCobrosTodayTray([baseEntry]);
    clearCobrosTodayTray();
    expect(readCobrosTodayTray()).toEqual([]);
    expect(sessionStorage.getItem(COBROS_TODAY_TRAY_STORAGE_KEY)).toBeNull();
  });
});

describe("shouldClearCobrosFollowThrough (legacy)", () => {
  it("clears when the snapshot already has stamped REP", () => {
    expect(
      shouldClearCobrosFollowThrough(
        { ...baseEntry, repStatus: "stamped" },
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
      shouldClearCobrosFollowThrough(baseEntry, {
        exceptionsFetched: true,
        exceptionPaymentIds: ["pay-1", "pay-other"],
        previouslySeenInExceptions: true,
      }),
    ).toBe(false);
  });

  it("clears after the payment left exceptions once observed there", () => {
    expect(
      shouldClearCobrosFollowThrough(baseEntry, {
        exceptionsFetched: true,
        exceptionPaymentIds: ["pay-other"],
        previouslySeenInExceptions: true,
      }),
    ).toBe(true);
  });

  it("does not clear on absence before the payment was ever seen (stale cache)", () => {
    expect(
      shouldClearCobrosFollowThrough(baseEntry, {
        exceptionsFetched: true,
        exceptionPaymentIds: [],
        previouslySeenInExceptions: false,
        nowMs: Date.parse("2026-08-18T12:00:01.000Z"),
      }),
    ).toBe(false);
  });

  it("clears on absence after grace when returning to Cobros post-stamp", () => {
    expect(
      shouldClearCobrosFollowThrough(baseEntry, {
        exceptionsFetched: true,
        exceptionPaymentIds: [],
        previouslySeenInExceptions: false,
        nowMs:
          Date.parse(baseEntry.recordedAt) + COBROS_FOLLOW_THROUGH_ABSENCE_GRACE_MS,
      }),
    ).toBe(true);
  });

  it("does not clear when the exceptions page may be incomplete", () => {
    expect(
      shouldClearCobrosFollowThrough(baseEntry, {
        exceptionsFetched: true,
        exceptionPaymentIds: [],
        exceptionsMayBeIncomplete: true,
        previouslySeenInExceptions: true,
      }),
    ).toBe(false);
  });
});
