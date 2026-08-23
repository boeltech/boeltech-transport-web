import { describe, expect, it } from "vitest";

import { mapPayment } from "./mappers";
import { sanitizeRepLastErrorForDisplay } from "./sanitizeRepLastErrorForDisplay";

describe("sanitizeRepLastErrorForDisplay", () => {
  it("returns null for blank", () => {
    expect(sanitizeRepLastErrorForDisplay(null)).toBeNull();
    expect(sanitizeRepLastErrorForDisplay("  ")).toBeNull();
  });

  it("replaces PAC dumps with a generic message", () => {
    expect(
      sanitizeRepLastErrorForDisplay(
        'ProFact TimbraCFDI error: <?xml version="1.0"?><soap>secret</soap>',
      ),
    ).toBe(
      "No se pudo timbrar el complemento de pago (REP). Reintente más tarde o contacte a soporte.",
    );
  });

  it("keeps short operational messages", () => {
    expect(sanitizeRepLastErrorForDisplay("Timeout al PAC")).toBe(
      "Timeout al PAC",
    );
  });
});

describe("payment mappers", () => {
  it("maps payment_time from API", () => {
    const payment = mapPayment({
      id: "p1",
      invoice_id: "inv",
      amount: 100,
      currency: "MXN",
      exchange_rate: 1,
      amount_mxn: 100,
      payment_date: "2026-06-08",
      payment_time: "15:30:00",
      payment_form: "03",
      payment_form_name: null,
      reference: null,
      notes: null,
      created_at: "2026-06-08T12:00:00Z",
      created_by_name: null,
    });
    expect(payment.paymentTime).toBe("15:30:00");
  });

  it("defaults payment_time when absent", () => {
    const payment = mapPayment({
      id: "p1",
      invoice_id: "inv",
      amount: 100,
      currency: "MXN",
      exchange_rate: 1,
      amount_mxn: 100,
      payment_date: "2026-06-08",
      payment_form: "03",
      payment_form_name: null,
      reference: null,
      notes: null,
      created_at: "2026-06-08T12:00:00Z",
      created_by_name: null,
    });
    expect(payment.paymentTime).toBe("12:00:00");
  });

  it("maps REP installment snapshot fields from API", () => {
    const payment = mapPayment({
      id: "p1",
      invoice_id: "inv",
      amount: 500,
      currency: "MXN",
      exchange_rate: 1,
      amount_mxn: 500,
      payment_date: "2026-06-08",
      payment_form: "03",
      payment_form_name: null,
      reference: null,
      notes: null,
      rep_status: "stamped",
      has_rep_xml: true,
      rep_num_parcialidad: 1,
      rep_imp_saldo_ant: 1160,
      rep_imp_saldo_insoluto: 660,
      rep_imp_pagado: 500,
      created_at: "2026-06-08T12:00:00Z",
      created_by_name: null,
    });
    expect(payment.hasRepXml).toBe(true);
    expect(payment.repNumParcialidad).toBe(1);
    expect(payment.repImpSaldoAnt).toBe(1160);
    expect(payment.repImpSaldoInsoluto).toBe(660);
    expect(payment.repImpPagado).toBe(500);
  });

  it("scrubs PAC dump in rep_last_error when mapping", () => {
    const payment = mapPayment({
      id: "p1",
      invoice_id: "inv",
      amount: 100,
      currency: "MXN",
      exchange_rate: 1,
      amount_mxn: 100,
      payment_date: "2026-06-08",
      payment_form: "03",
      payment_form_name: null,
      reference: null,
      notes: null,
      rep_status: "failed",
      rep_last_error: "ProFact SOAP dump <?xml?>",
      created_at: "2026-06-08T12:00:00Z",
      created_by_name: null,
    });
    expect(payment.repLastError).not.toMatch(/SOAP|ProFact|<\?xml/i);
    expect(payment.repLastError).toContain("complemento de pago");
  });
});
