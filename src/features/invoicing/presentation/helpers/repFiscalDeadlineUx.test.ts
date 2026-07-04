import { describe, expect, it } from "vitest";

import {
  formatPaymentReceivedAt,
  getWorstRepFiscalDeadlineStatus,
} from "./repFiscalDeadlineUx";
import type { Payment } from "@features/invoicing/domain";

function makePayment(partial: Partial<Payment>): Payment {
  return {
    id: "p1",
    invoiceId: "inv",
    amount: 100,
    currency: "MXN",
    exchangeRate: 1,
    amountMxn: 100,
    paymentDate: "2026-06-08",
    paymentTime: "12:00:00",
    paymentForm: "03",
    paymentFormName: null,
    reference: null,
    notes: null,
    createdAt: "2026-06-08T12:00:00Z",
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
    ...partial,
  };
}

describe("repFiscalDeadlineUx", () => {
  it("flags overdue when pending past 5th day RMF", () => {
    const status = getWorstRepFiscalDeadlineStatus([
      makePayment({ repStatus: "pending", paymentDate: "2020-01-15" }),
    ]);
    expect(status).toBe("overdue");
  });

  it("ok when REP stamped", () => {
    const status = getWorstRepFiscalDeadlineStatus([
      makePayment({ repStatus: "stamped", paymentDate: "2026-01-01" }),
    ]);
    expect(status).toBeNull();
  });

  it("formatPaymentReceivedAt shows time when not noon", () => {
    expect(formatPaymentReceivedAt("2026-06-08", "15:30:00")).toBe(
      "2026-06-08 15:30",
    );
    expect(formatPaymentReceivedAt("2026-06-08", "12:00:00")).toBe("2026-06-08");
  });
});
