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
  Payment,
  FinanceSummary,
  AccountStatementItem,
  InvoicePrefill,
  PaginatedInvoices,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CancelInvoicePayload,
  CreatePaymentPayload,
  SubstituteStampedInvoicePayload,
  SubstituteStampedInvoiceResult,
  InvoiceFilters,
} from "@features/invoicing/domain";
import {
  mapInvoice,
  mapInvoiceListItem,
  mapPayment,
  mapFinanceSummary,
  mapAccountStatementItem,
  mapInvoicePrefill,
  toApiCreateInvoice,
  toApiUpdateInvoice,
  toApiCancelInvoice,
  toApiCreatePayment,
  toApiSubstituteStampedInvoice,
} from "./mappers";
import { decodeHtmlEntityEncodedXml } from "@shared/utils/decodeHtmlEntityXml";

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
      data: (response.data as unknown[]).map((item) =>
        mapInvoiceListItem(item as Record<string, unknown>),
      ),
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
    return mapInvoice(response.data as Record<string, unknown>);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // CREATE / UPDATE / DELETE
  // ──────────────────────────────────────────────────────────────────────────

  create: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const response = await apiClient.post<{ data: unknown; message: string }>(
      INVOICES,
      toApiCreateInvoice(payload),
    );
    return mapInvoice(response.data as Record<string, unknown>);
  },

  update: async (
    id: string,
    payload: UpdateInvoicePayload,
  ): Promise<Invoice> => {
    const response = await apiClient.put<{ data: unknown }>(
      `${INVOICES}/${id}`,
      toApiUpdateInvoice(payload),
    );
    return mapInvoice(response.data as Record<string, unknown>);
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
    return mapInvoice(response.data as Record<string, unknown>);
  },

  cancel: async (
    id: string,
    payload: CancelInvoicePayload,
  ): Promise<Invoice> => {
    const response = await apiClient.post<{ data: unknown }>(
      `${INVOICES}/${id}/cancel`,
      toApiCancelInvoice(payload),
    );
    return mapInvoice(response.data as Record<string, unknown>);
  },

  substituteStampedInvoice: async (
    id: string,
    payload: SubstituteStampedInvoicePayload,
  ): Promise<SubstituteStampedInvoiceResult> => {
    const response = await apiClient.post<{
      data: { replacement: unknown; original: unknown };
    }>(`${INVOICES}/${id}/substitute`, toApiSubstituteStampedInvoice(payload));
    const d = response.data;
    return {
      replacement: mapInvoice(d.replacement as Record<string, unknown>),
      original: mapInvoice(d.original as Record<string, unknown>),
    };
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PAYMENTS
  // ──────────────────────────────────────────────────────────────────────────

  getPayments: async (invoiceId: string): Promise<Payment[]> => {
    const response = await apiClient.get<{ data: unknown[] }>(
      `${INVOICES}/${invoiceId}/payments`,
    );
    return (response.data as unknown[]).map((payment) =>
      mapPayment(payment as Record<string, unknown>),
    );
  },

  registerPayment: async (
    invoiceId: string,
    payload: CreatePaymentPayload,
  ): Promise<Payment> => {
    const response = await apiClient.post<{ data: unknown }>(
      `${INVOICES}/${invoiceId}/payments`,
      toApiCreatePayment(payload),
    );
    return mapPayment(response.data as Record<string, unknown>);
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PDF / XML
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Abre el PDF de la factura en una nueva pestaña.
   * Usa GET /invoices/:id/pdf (genera on-demand si no existe).
   * Añade `?refresh=1` para forzar regeneración (p. ej. tras cambios en la plantilla o en Carta Porte).
   */
  openPdf: async (
    id: string,
    serieFolio: string,
    options?: { refresh?: boolean },
  ): Promise<void> => {
    const axios = apiClient.getAxiosInstance();
    const qs = options?.refresh ? "?refresh=1" : "";
    const response = await axios.get<Blob>(`${INVOICES}/${id}/pdf${qs}`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `${serieFolio}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Descarga el XML timbrado (CFDI + complementos, p. ej. Carta Porte 3.1 y TFD).
   * Usa el `xmlContent` ya cargado en la factura (GET /invoices/:id).
   */
  downloadXml: (xmlContent: string, serieFolio: string): void => {
    const decoded = decodeHtmlEntityEncodedXml(xmlContent);
    const blob = new Blob([decoded], {
      type: "application/xml;charset=utf-8",
    });
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
    return mapFinanceSummary(response.data as Record<string, unknown>);
  },

  getAccountStatement: async (): Promise<AccountStatementItem[]> => {
    const response = await apiClient.get<{ data: unknown[] }>(
      `${FINANCE}/account-statement`,
    );
    return (response.data as unknown[]).map((item) =>
      mapAccountStatementItem(item as Record<string, unknown>),
    );
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PREFILL
  // ──────────────────────────────────────────────────────────────────────────

  getPrefillFromTrip: async (tripId: string): Promise<InvoicePrefill> => {
    const response = await apiClient.get<{ data: unknown }>(
      `${FINANCE}/prefill/${tripId}`,
    );
    return mapInvoicePrefill(response.data as Record<string, unknown>);
  },
};
