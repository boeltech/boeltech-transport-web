/**
 * API client — descarga masiva de CFDI (ADR-0104).
 */

import { apiClient } from "@shared/api";
import type {
  InvoiceBulkDownloadCriteria,
  InvoiceBulkDownloadJob,
  InvoiceBulkDownloadPreview,
} from "@features/invoicing/domain";
import {
  mapInvoiceBulkDownloadJob,
  mapInvoiceBulkDownloadPreview,
  parseContentDispositionFileName,
  type ApiInvoiceBulkDownloadJob,
  type ApiInvoiceBulkDownloadPreview,
} from "./invoiceBulkDownloadMappers";

const BASE = "/invoices/bulk-downloads";

function appendCriteriaParams(
  params: URLSearchParams,
  criteria: InvoiceBulkDownloadCriteria,
): void {
  params.set("period_from", criteria.periodFrom);
  params.set("period_to", criteria.periodTo);
  if (criteria.receiverRfc) {
    params.set("receiver_rfc", criteria.receiverRfc);
  }
  params.set("content", criteria.content);
  params.set("include_payments", String(criteria.includePayments));
  params.set("include_cancelled", String(criteria.includeCancelled));
}

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const invoiceBulkDownloadApi = {
  preview: async (
    criteria: InvoiceBulkDownloadCriteria,
  ): Promise<InvoiceBulkDownloadPreview> => {
    const params = new URLSearchParams();
    appendCriteriaParams(params, criteria);
    const response = await apiClient.get<{
      data: ApiInvoiceBulkDownloadPreview;
    }>(`${BASE}/preview?${params.toString()}`);
    return mapInvoiceBulkDownloadPreview(response.data);
  },

  create: async (
    criteria: InvoiceBulkDownloadCriteria,
  ): Promise<InvoiceBulkDownloadJob> => {
    const response = await apiClient.post<{
      data: ApiInvoiceBulkDownloadJob;
      message?: string;
    }>(BASE, {
      periodFrom: criteria.periodFrom,
      periodTo: criteria.periodTo,
      receiverRfc: criteria.receiverRfc,
      content: criteria.content,
      includePayments: criteria.includePayments,
      includeCancelled: criteria.includeCancelled,
    });
    return mapInvoiceBulkDownloadJob(response.data);
  },

  listMine: async (limit = 5): Promise<InvoiceBulkDownloadJob[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    const response = await apiClient.get<{
      data: ApiInvoiceBulkDownloadJob[];
    }>(`${BASE}?${params.toString()}`);
    return (response.data ?? []).map(mapInvoiceBulkDownloadJob);
  },

  getById: async (id: string): Promise<InvoiceBulkDownloadJob> => {
    const response = await apiClient.get<{
      data: ApiInvoiceBulkDownloadJob;
    }>(`${BASE}/${id}`);
    return mapInvoiceBulkDownloadJob(response.data);
  },

  downloadPart: async (
    id: string,
    part: number,
    fallbackFileName?: string,
  ): Promise<void> => {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<Blob>(`${BASE}/${id}/file`, {
      params: { part },
      responseType: "blob",
    });
    const header =
      response.headers["content-disposition"] ??
      response.headers["Content-Disposition"];
    const fileName =
      parseContentDispositionFileName(
        typeof header === "string" ? header : undefined,
      ) ??
      fallbackFileName ??
      `CFDI_parte-${part}.zip`;
    triggerBlobDownload(
      new Blob([response.data], { type: "application/zip" }),
      fileName,
    );
  },
};
