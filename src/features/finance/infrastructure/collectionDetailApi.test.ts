import { describe, expect, it } from "vitest";
import {
  mapPaymentCollectionDetail,
  mapReceiptCollectionDetail,
} from "./collectionDetailApi";

describe("collectionDetailApi mappers", () => {
  it("maps GET /payments/:id detail with comprobante block", () => {
    const detail = mapPaymentCollectionDetail({
      channel: "with_invoice",
      id: "pay-1",
      client_id: "cli-1",
      client_name: "Cliente Demo",
      amount: 1000,
      currency: "MXN",
      amount_mxn: 1000,
      payment_date: "2026-11-16",
      payment_time: "12:00:00",
      payment_form: "03",
      payment_form_name: "Transferencia",
      reference: "SPEI 1",
      notes: null,
      created_by_name: "Rosa",
      created_at: "2026-11-16T16:00:00.000Z",
      status: "stamped",
      allocations: [
        {
          id: "alloc-1",
          ingress_invoice_id: "inv-1",
          amount: 1000,
          currency: "MXN",
          serie: "F",
          folio: 1211,
          receiver_name: "Cliente Demo",
          rep_num_parcialidad: 1,
          rep_imp_saldo_ant: 1000,
          rep_imp_saldo_insoluto: 0,
        },
      ],
      comprobante: {
        emits: true,
        rep_status: "stamped",
        rep_serie_folio: "P-0312",
        rep_uuid: "UUID-1",
        stamped_at: "2026-11-16T16:01:00.000Z",
        last_error: null,
        rep_attempts: 1,
        fiscal_deadline: { date: "2026-12-16", status: "ok" },
        wait_reason: null,
        blocking_payment_id: null,
        dispatch_sent_at: null,
      },
    });

    expect(detail.channel).toBe("with_invoice");
    expect(detail.id).toBe("pay-1");
    expect(detail.allocations).toHaveLength(1);
    expect(detail.allocations[0]?.serie).toBe("F");
    expect(detail.comprobante.emits).toBe(true);
    expect(detail.comprobante.repSerieFolio).toBe("P-0312");
    expect(detail.comprobante.blockingPaymentId).toBeNull();
  });

  it("maps legacy receipt detail with emits:false", () => {
    const detail = mapReceiptCollectionDetail({
      channel: "without_invoice",
      kind: "receipt",
      id: "rcpt-1",
      trip_id: "trip-1",
      amount: 500,
      collected_at: "2026-11-16T15:00:00.000Z",
      note: null,
      payment_instrument: "cash",
      reference: null,
      batch_id: null,
      created_by: "user-1",
      created_at: "2026-11-16T15:00:00.000Z",
      voided_at: null,
      voided_by: null,
      void_reason: null,
      comprobante: { emits: false },
    });

    expect(detail.channel).toBe("without_invoice");
    expect(detail.kind).toBe("receipt");
    expect(detail.batchId).toBeNull();
    expect(detail.comprobante.emits).toBe(false);
  });
});
