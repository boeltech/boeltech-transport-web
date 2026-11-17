/**
 * API detalle unificado del cobro (F3 · F0b aliases).
 */

import { apiClient } from "@shared/api";
import type {
  PaymentCollectionDetail,
  ReceiptCollectionDetail,
  CollectionComprobanteEmits,
  PaymentCollectionAllocation,
} from "@features/finance/domain/collectionDetail";
import type {
  FinanceRepLiveStatus,
  FinanceRepWaitReason,
} from "@features/finance/domain";
import type { OperationalPaymentInstrument } from "@features/finance/domain/operationalReceiptBatch";

const REP_LIVE_STATUSES = new Set<FinanceRepLiveStatus>([
  "not_required",
  "pending",
  "stamped",
  "failed",
  "restamp_pending",
  "cancelling",
  "cancelled",
]);

const REP_WAIT_REASONS = new Set<FinanceRepWaitReason>([
  "queued",
  "retry_scheduled",
  "blocked_by_prior",
  "pac_clock",
  "quota",
  "manual_review",
]);

function mapRepLiveStatus(raw: unknown): FinanceRepLiveStatus {
  const value = String(raw ?? "pending") as FinanceRepLiveStatus;
  return REP_LIVE_STATUSES.has(value) ? value : "pending";
}

function mapRepWaitReason(raw: unknown): FinanceRepWaitReason | string | null {
  if (raw == null || raw === "") return null;
  const value = String(raw);
  return REP_WAIT_REASONS.has(value as FinanceRepWaitReason)
    ? (value as FinanceRepWaitReason)
    : value;
}

function mapInstrument(raw: unknown): OperationalPaymentInstrument {
  if (
    raw === "cash" ||
    raw === "transfer" ||
    raw === "check" ||
    raw === "other"
  ) {
    return raw;
  }
  return "cash";
}

function mapAllocation(
  raw: Record<string, unknown>,
): PaymentCollectionAllocation {
  return {
    id: String(raw.id ?? ""),
    ingressInvoiceId: String(raw.ingress_invoice_id ?? ""),
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? "MXN"),
    serie: raw.serie == null ? null : String(raw.serie),
    folio: raw.folio == null ? null : Number(raw.folio),
    receiverName:
      raw.receiver_name == null ? null : String(raw.receiver_name),
    repNumParcialidad:
      raw.rep_num_parcialidad == null
        ? null
        : Number(raw.rep_num_parcialidad),
    repImpSaldoAnt:
      raw.rep_imp_saldo_ant == null ? null : Number(raw.rep_imp_saldo_ant),
    repImpSaldoInsoluto:
      raw.rep_imp_saldo_insoluto == null
        ? null
        : Number(raw.rep_imp_saldo_insoluto),
  };
}

function mapComprobanteEmits(
  raw: Record<string, unknown>,
): CollectionComprobanteEmits {
  const deadlineRaw = raw.fiscal_deadline as Record<string, unknown> | null;
  return {
    emits: true,
    repStatus: mapRepLiveStatus(raw.rep_status),
    repSerieFolio:
      raw.rep_serie_folio == null ? null : String(raw.rep_serie_folio),
    repUuid: raw.rep_uuid == null ? null : String(raw.rep_uuid),
    stampedAt: raw.stamped_at == null ? null : String(raw.stamped_at),
    lastError: raw.last_error == null ? null : String(raw.last_error),
    repAttempts: Number(raw.rep_attempts ?? 0),
    fiscalDeadline:
      deadlineRaw == null
        ? null
        : {
            date: String(deadlineRaw.date ?? ""),
            status: String(deadlineRaw.status ?? "ok"),
          },
    waitReason: mapRepWaitReason(raw.wait_reason),
    blockingPaymentId:
      raw.blocking_payment_id == null || raw.blocking_payment_id === ""
        ? null
        : String(raw.blocking_payment_id),
    dispatchSentAt:
      raw.dispatch_sent_at == null || raw.dispatch_sent_at === ""
        ? null
        : String(raw.dispatch_sent_at),
  };
}

export function mapPaymentCollectionDetail(
  raw: Record<string, unknown>,
): PaymentCollectionDetail {
  const comprobanteRaw = (raw.comprobante ?? {}) as Record<string, unknown>;
  const allocations = Array.isArray(raw.allocations)
    ? raw.allocations.map((item) =>
        mapAllocation(item as Record<string, unknown>),
      )
    : [];
  return {
    channel: "with_invoice",
    id: String(raw.id ?? ""),
    clientId:
      raw.client_id == null || raw.client_id === ""
        ? null
        : String(raw.client_id),
    clientName:
      raw.client_name == null || raw.client_name === ""
        ? null
        : String(raw.client_name),
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? "MXN"),
    amountMxn: Number(raw.amount_mxn ?? raw.amount ?? 0),
    paymentDate: String(raw.payment_date ?? ""),
    paymentTime: String(raw.payment_time ?? "12:00:00"),
    paymentForm: String(raw.payment_form ?? ""),
    paymentFormName:
      raw.payment_form_name == null ? null : String(raw.payment_form_name),
    reference: raw.reference == null ? null : String(raw.reference),
    notes: raw.notes == null ? null : String(raw.notes),
    createdByName:
      raw.created_by_name == null ? null : String(raw.created_by_name),
    createdAt: String(raw.created_at ?? ""),
    status: mapRepLiveStatus(raw.status ?? comprobanteRaw.rep_status),
    allocations,
    comprobante: mapComprobanteEmits(comprobanteRaw),
  };
}

export function mapReceiptCollectionDetail(
  raw: Record<string, unknown>,
): ReceiptCollectionDetail {
  return {
    channel: "without_invoice",
    kind: "receipt",
    id: String(raw.id ?? ""),
    tripId: String(raw.trip_id ?? ""),
    amount: Number(raw.amount ?? 0),
    collectedAt: String(raw.collected_at ?? ""),
    note: raw.note == null ? null : String(raw.note),
    paymentInstrument: mapInstrument(raw.payment_instrument),
    reference: raw.reference == null ? null : String(raw.reference),
    batchId:
      raw.batch_id == null || raw.batch_id === ""
        ? null
        : String(raw.batch_id),
    createdBy: String(raw.created_by ?? ""),
    createdAt: String(raw.created_at ?? ""),
    voidedAt: raw.voided_at == null ? null : String(raw.voided_at),
    voidedBy: raw.voided_by == null ? null : String(raw.voided_by),
    voidReason: raw.void_reason == null ? null : String(raw.void_reason),
    comprobante: { emits: false },
  };
}

export const collectionDetailApi = {
  getPaymentDetail: async (
    paymentId: string,
  ): Promise<PaymentCollectionDetail> => {
    const response = await apiClient.get<{ data: Record<string, unknown> }>(
      `/payments/${paymentId}`,
    );
    return mapPaymentCollectionDetail(
      response.data as Record<string, unknown>,
    );
  },

  getReceiptDetail: async (
    receiptId: string,
  ): Promise<ReceiptCollectionDetail> => {
    const response = await apiClient.get<{ data: Record<string, unknown> }>(
      `/operational-cash-receipts/${receiptId}`,
    );
    return mapReceiptCollectionDetail(
      response.data as Record<string, unknown>,
    );
  },

  retryRep: async (paymentId: string): Promise<void> => {
    await apiClient.post(`/payments/${paymentId}/retry-rep`);
  },

  downloadRepXml: async (
    paymentId: string,
    filename: string,
  ): Promise<void> => {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<Blob>(`/payments/${paymentId}/xml`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/xml;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  openRepPdf: async (paymentId: string, filename: string): Promise<void> => {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<Blob>(`/payments/${paymentId}/pdf`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  voidReceipt: async (
    tripId: string,
    receiptId: string,
    reason: string,
  ): Promise<void> => {
    await apiClient.post(
      `/trips/${tripId}/operational-cash-receipts/${receiptId}/void`,
      { reason },
    );
  },
};
