/**
 * Invoicing API Client
 * Clean Architecture - Infrastructure Layer
 *
 * Comunicación HTTP con el backend de facturación.
 * Retorna siempre entidades del dominio.
 */

import { apiClient } from "@shared/api";
import type {
  Invoice,
  InvoiceListItem,
  Payment,
  FinanceSummary,
  AccountStatementItem,
  InvoicePrefill,
  PaginatedInvoices,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreatePaymentPayload,
  InvoiceFilters,
} from "@features/invoicing/domain";
import {
  mapInvoice,
  mapInvoiceListItem,
  mapPayment as _mapPayment,
  mapFinanceSummary,
  mapAccountStatementItem,
  mapInvoicePrefill,
  toApiCreateInvoice,
  toApiUpdateInvoice,
  toApiCancelInvoice,
  toApiCreatePayment,
} from "./mappers";

const INVOICES = "/invoices";
const FINANCE = "/finance";

export const invoicingApi = {
  // ──────────────────────────────────────────────────────────────────────────
  // INVOICES LIST
  // ──────────────────────────────────────────────────────────────────────────

  getAll: async (filters?: InvoiceFilters): Promise<PaginatedInvoices> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.receiverRfc)
      params.append("receiver_rfc", filters.receiverRfc);
    if (filters?.dateFrom) params.append("date_from", filters.dateFrom);
    if (filters?.dateTo) params.append("date_to", filters.dateTo);
    if (filters?.search) params.append("search", filters.search);
    if (filters?.page) params.append("page", String(filters.page));
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.sortBy) params.append("sort_by", filters.sortBy);
    if (filters?.sortOrder) params.append("sort_order", filters.sortOrder);

    const qs = params.toString();
    const response = await apiClient.get<{
      data: unknown[];
      pagination: unknown;
    }>(`${INVOICES}${qs ? `?${qs}` : ""}`);

    return {
      data: (response.data as any[]).map(mapInvoiceListItem),
      pagination: response.pagination as PaginatedInvoices["pagination"],
    };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INVOICE DETAIL
  // ──────────────────────────────────────────────────────────────────────────

  getById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<{ data: unknown }>(
      `${INVOICES}/${id}`,
    );
    return mapInvoice(response.data as any);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CREATE / UPDATE / DELETE
  // ──────────────────────────────────────────────────────────────────────────

  create: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const response = await apiClient.post<{ data: unknown; message: string }>(
      INVOICES,
      toApiCreateInvoice(payload),
    );
    return mapInvoice(response.data as any);
  },

  update: async (
    id: string,
    payload: UpdateInvoicePayload,
  ): Promise<Invoice> => {
    const response = await apiClient.put<{ data: unknown }>(
      `${INVOICES}/${id}`,
      toApiUpdateInvoice(payload),
    );
    return mapInvoice(response.data as any);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${INVOICES}/${id}`);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // STAMP / CANCEL
  // ──────────────────────────────────────────────────────────────────────────

  stamp: async (id: string): Promise<Invoice> => {
    const response = await apiClient.post<{ data: unknown }>(
      `${INVOICES}/${id}/stamp`,
    );
    return mapInvoice(response.data as any);
  },

  cancel: async (
    id: string,
    payload: CancelInvoicePayload,
  ): Promise<Invoice> => {
    const response = await apiClient.post<{ data: unknown }>(
      `${INVOICES}/${id}/cancel`,
      toApiCancelInvoice(payload),
    );
    return mapInvoice(response.data as any);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PAYMENTS
  // ──────────────────────────────────────────────────────────────────────────

  getPayments: async (invoiceId: string): Promise<Payment[]> => {
    const response = await apiClient.get<{ data: unknown[] }>(
      `${INVOICES}/${invoiceId}/payments`,
    );
    return (response.data as any[]).map((p: any) => ({
      id: p.id,
      invoiceId: p.invoice_id,
      amount: p.amount,
      currency: p.currency,
      exchangeRate: p.exchange_rate,
      amountMxn: p.amount_mxn,
      paymentDate: p.payment_date,
      paymentForm: p.payment_form,
      paymentFormName: p.payment_form_name,
      reference: p.reference,
      notes: p.notes,
      createdAt: p.created_at,
      createdByName: p.created_by_name,
    }));
  },

  registerPayment: async (
    invoiceId: string,
    payload: CreatePaymentPayload,
  ): Promise<Payment> => {
    const response = await apiClient.post<{ data: unknown }>(
      `${INVOICES}/${invoiceId}/payments`,
      toApiCreatePayment(payload),
    );
    const p = response.data as any;
    return {
      id: p.id,
      invoiceId: p.invoice_id,
      amount: p.amount,
      currency: p.currency,
      exchangeRate: p.exchange_rate,
      amountMxn: p.amount_mxn,
      paymentDate: p.payment_date,
      paymentForm: p.payment_form,
      paymentFormName: p.payment_form_name,
      reference: p.reference,
      notes: p.notes,
      createdAt: p.created_at,
      createdByName: p.created_by_name,
    };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PDF / XML
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Abre el PDF de la factura en una nueva pestaña.
   * Usa el endpoint autenticado GET /invoices/:id/pdf (genera on-demand si no existe).
   */
  openPdf: async (id: string, serieFolio: string): Promise<void> => {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<Blob>(`${INVOICES}/${id}/pdf`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Descarga el XML timbrado de la factura (desde el campo xmlContent en memoria).
   * No hace llamada HTTP — usa el XML ya cargado en la entidad.
   */
  downloadXml: (xmlContent: string, serieFolio: string): void => {
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cfdi-${serieFolio}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // FINANCE SUMMARY & ACCOUNT STATEMENT
  // ──────────────────────────────────────────────────────────────────────────

  getFinanceSummary: async (): Promise<FinanceSummary> => {
    const response = await apiClient.get<{ data: unknown }>(
      `${FINANCE}/summary`,
    );
    return mapFinanceSummary(response.data as any);
  },

  getAccountStatement: async (): Promise<AccountStatementItem[]> => {
    const response = await apiClient.get<{ data: unknown[] }>(
      `${FINANCE}/account-statement`,
    );
    return (response.data as any[]).map(mapAccountStatementItem);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PREFILL
  // ──────────────────────────────────────────────────────────────────────────

  getPrefillFromTrip: async (tripId: string): Promise<InvoicePrefill> => {
    const response = await apiClient.get<{ data: unknown }>(
      `${FINANCE}/prefill/${tripId}`,
    );
    return mapInvoicePrefill(response.data as any);
  },
};
