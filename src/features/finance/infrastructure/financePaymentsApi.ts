import { apiClient } from "@shared/api";
import type {
  FinanceInvoiceListItem,
  FinancePayment,
  PaginatedFinanceInvoices,
} from "@features/finance/domain";

export interface FinancePaymentAllocationPayload {
  ingressInvoiceId: string;
  amount: number;
}

export interface RegisterFinancePaymentPayload {
  receiverRfc: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  paymentDate: string;
  paymentTime?: string;
  paymentForm: string;
  reference?: string;
  notes?: string;
  confirmChainRepair?: boolean;
  allocations: FinancePaymentAllocationPayload[];
}

function mapOpenPpdItem(raw: Record<string, unknown>): FinanceInvoiceListItem {
  return {
    id: String(raw.id ?? ""),
    serie: String(raw.serie ?? ""),
    folio: Number(raw.folio ?? 0),
    receiverRfc: String(raw.receiver_rfc ?? ""),
    receiverName: String(raw.receiver_name ?? ""),
    issuedAt: String(raw.issued_at ?? ""),
    paymentMethod: String(raw.payment_method ?? ""),
    total: Number(raw.total ?? 0),
    balanceDue: Number(raw.balance_due ?? 0),
    tripCodes: Array.isArray(raw.trip_codes)
      ? raw.trip_codes.map((code) => String(code))
      : [],
    status: String(raw.status ?? "stamped") as FinanceInvoiceListItem["status"],
  };
}

function mapFinancePayment(raw: unknown): FinancePayment {
  const payment = raw as Record<string, unknown>;
  return {
    id: String(payment.id ?? ""),
    invoiceId: String(payment.invoice_id ?? ""),
    amount: Number(payment.amount ?? 0),
    currency: String(payment.currency ?? "MXN"),
    exchangeRate: Number(payment.exchange_rate ?? 1),
    amountMxn: Number(payment.amount_mxn ?? payment.amount ?? 0),
    paymentDate: String(payment.payment_date ?? ""),
    paymentTime: String(payment.payment_time ?? "12:00:00"),
    paymentForm: String(payment.payment_form ?? ""),
    paymentFormName:
      payment.payment_form_name == null ? null : String(payment.payment_form_name),
    reference: payment.reference == null ? null : String(payment.reference),
    notes: payment.notes == null ? null : String(payment.notes),
    createdAt: String(payment.created_at ?? ""),
    createdByName:
      payment.created_by_name == null ? null : String(payment.created_by_name),
    repCfdiUuid:
      payment.rep_cfdi_uuid == null ? null : String(payment.rep_cfdi_uuid),
    repStampedAt:
      payment.rep_stamped_at == null ? null : String(payment.rep_stamped_at),
    repStatus: String(payment.rep_status ?? "not_required"),
    repAttempts: Number(payment.rep_attempts ?? 0),
    repLastError:
      payment.rep_last_error == null ? null : String(payment.rep_last_error),
    hasRepXml: Boolean(payment.has_rep_xml ?? false),
    repNumParcialidad:
      payment.rep_num_parcialidad == null
        ? null
        : Number(payment.rep_num_parcialidad),
    repImpSaldoAnt:
      payment.rep_imp_saldo_ant == null ? null : Number(payment.rep_imp_saldo_ant),
    repImpSaldoInsoluto:
      payment.rep_imp_saldo_insoluto == null
        ? null
        : Number(payment.rep_imp_saldo_insoluto),
    repImpPagado:
      payment.rep_imp_pagado == null ? null : Number(payment.rep_imp_pagado),
  };
}

export const financePaymentsApi = {
  getOpenPpdInvoices: async (
    receiverRfc: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedFinanceInvoices> => {
    const params = new URLSearchParams({
      receiver_rfc: receiverRfc,
      page: String(page),
      limit: String(limit),
    });
    const response = await apiClient.get<{
      data: unknown[];
      pagination: PaginatedFinanceInvoices["pagination"];
    }>(`/finance/open-ppd-invoices?${params.toString()}`);
    return {
      data: (response.data as unknown[]).map((item) =>
        mapOpenPpdItem(item as Record<string, unknown>),
      ),
      pagination: response.pagination,
    };
  },

  registerPayment: async (
    payload: RegisterFinancePaymentPayload,
  ): Promise<FinancePayment> => {
    const body: Record<string, unknown> = {
      receiver_rfc: payload.receiverRfc,
      amount: payload.amount,
      currency: payload.currency ?? "MXN",
      exchange_rate: payload.exchangeRate ?? 1,
      payment_date: payload.paymentDate,
      payment_time: payload.paymentTime ?? "12:00:00",
      payment_form: payload.paymentForm,
      reference: payload.reference,
      notes: payload.notes,
      allocations: payload.allocations.map((a) => ({
        ingress_invoice_id: a.ingressInvoiceId,
        amount: a.amount,
      })),
    };
    if (payload.confirmChainRepair) {
      body.confirm_chain_repair = true;
    }
    const response = await apiClient.post<{ data: unknown }>(
      "/finance/payments",
      body,
    );
    return mapFinancePayment(response.data);
  },
};
