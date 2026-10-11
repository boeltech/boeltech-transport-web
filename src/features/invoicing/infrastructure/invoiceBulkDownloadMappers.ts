/**
 * Mappers snake_case → camelCase para descarga masiva CFDI (ADR-0104).
 */

import type {
  InvoiceBulkDownloadContent,
  InvoiceBulkDownloadJob,
  InvoiceBulkDownloadPart,
  InvoiceBulkDownloadPreview,
  InvoiceBulkDownloadStatus,
  InvoiceBulkDownloadWarning,
} from "@features/invoicing/domain";

export interface ApiInvoiceBulkDownloadWarning {
  uuid: string | null;
  serie_folio: string | null;
  kind: string;
  message: string;
}

export interface ApiInvoiceBulkDownloadPart {
  part: number;
  file_name: string;
  bytes: number;
  file_count: number;
}

export interface ApiInvoiceBulkDownloadJob {
  id: string;
  status: InvoiceBulkDownloadStatus;
  period_from: string;
  period_to: string;
  receiver_rfc: string | null;
  content: InvoiceBulkDownloadContent;
  include_payments: boolean;
  include_cancelled: boolean;
  invoice_count: number;
  payment_count: number;
  files_total: number;
  files_done: number;
  warnings_count: number;
  warnings: ApiInvoiceBulkDownloadWarning[];
  parts: ApiInvoiceBulkDownloadPart[];
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

export interface ApiInvoiceBulkDownloadPreview {
  invoice_count: number;
  cancelled_count: number;
  payment_count: number;
  files_total: number;
  exceeds_limit: boolean;
  limits: {
    max_months: number;
    max_documents: number;
  };
  earliest_allowed_period: string | null;
}

function mapWarning(
  raw: ApiInvoiceBulkDownloadWarning,
): InvoiceBulkDownloadWarning {
  return {
    uuid: raw.uuid ?? null,
    serieFolio: raw.serie_folio ?? null,
    kind: raw.kind,
    message: raw.message,
  };
}

function mapPart(raw: ApiInvoiceBulkDownloadPart): InvoiceBulkDownloadPart {
  return {
    part: Number(raw.part),
    fileName: String(raw.file_name ?? `part-${raw.part}.zip`),
    bytes: Number(raw.bytes ?? 0),
    fileCount: Number(raw.file_count ?? 0),
  };
}

export function mapInvoiceBulkDownloadJob(
  raw: ApiInvoiceBulkDownloadJob,
): InvoiceBulkDownloadJob {
  return {
    id: String(raw.id),
    status: raw.status,
    periodFrom: String(raw.period_from),
    periodTo: String(raw.period_to),
    receiverRfc: raw.receiver_rfc ?? null,
    content: raw.content,
    includePayments: Boolean(raw.include_payments),
    includeCancelled: Boolean(raw.include_cancelled),
    invoiceCount: Number(raw.invoice_count ?? 0),
    paymentCount: Number(raw.payment_count ?? 0),
    filesTotal: Number(raw.files_total ?? 0),
    filesDone: Number(raw.files_done ?? 0),
    warningsCount: Number(raw.warnings_count ?? 0),
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.map(mapWarning)
      : [],
    parts: Array.isArray(raw.parts) ? raw.parts.map(mapPart) : [],
    errorCode: raw.error_code ?? null,
    errorMessage: raw.error_message ?? null,
    createdAt: String(raw.created_at),
    startedAt: raw.started_at ?? null,
    completedAt: raw.completed_at ?? null,
    expiresAt: raw.expires_at ?? null,
  };
}

export function mapInvoiceBulkDownloadPreview(
  raw: ApiInvoiceBulkDownloadPreview,
): InvoiceBulkDownloadPreview {
  return {
    invoiceCount: Number(raw.invoice_count ?? 0),
    cancelledCount: Number(raw.cancelled_count ?? 0),
    paymentCount: Number(raw.payment_count ?? 0),
    filesTotal: Number(raw.files_total ?? 0),
    exceedsLimit: Boolean(raw.exceeds_limit),
    limits: {
      maxMonths: Number(raw.limits?.max_months ?? 12),
      maxDocuments: Number(raw.limits?.max_documents ?? 0),
    },
    earliestAllowedPeriod: raw.earliest_allowed_period ?? null,
  };
}

/** Parsea `Content-Disposition` (filename* UTF-8 o filename="…"). */
export function parseContentDispositionFileName(
  header: string | undefined | null,
): string | null {
  if (!header) return null;
  const utf8 = /filename\*=(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    const encoded = utf8[1].trim().replace(/^"|"$/g, "");
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;]+)/i.exec(header);
  return plain?.[1]?.trim().replace(/^"|"$/g, "") ?? null;
}
