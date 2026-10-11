/** ADR-0104 — descarga masiva de CFDI (job asíncrono). */

export type InvoiceBulkDownloadStatus =
  | "queued"
  | "processing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "expired";

export type InvoiceBulkDownloadContent = "xml_pdf" | "xml";

export type InvoiceBulkDownloadPeriodPreset =
  | "previous"
  | "current"
  | "custom";

export interface InvoiceBulkDownloadCriteria {
  periodFrom: string;
  periodTo: string;
  receiverRfc: string | null;
  content: InvoiceBulkDownloadContent;
  includePayments: boolean;
  includeCancelled: boolean;
}

export interface InvoiceBulkDownloadLimits {
  maxMonths: number;
  maxDocuments: number;
}

export interface InvoiceBulkDownloadPreview {
  invoiceCount: number;
  cancelledCount: number;
  paymentCount: number;
  filesTotal: number;
  exceedsLimit: boolean;
  limits: InvoiceBulkDownloadLimits;
  earliestAllowedPeriod: string | null;
}

export interface InvoiceBulkDownloadWarning {
  uuid: string | null;
  serieFolio: string | null;
  kind: string;
  message: string;
}

export interface InvoiceBulkDownloadPart {
  part: number;
  fileName: string;
  bytes: number;
  fileCount: number;
}

export interface InvoiceBulkDownloadJob {
  id: string;
  status: InvoiceBulkDownloadStatus;
  periodFrom: string;
  periodTo: string;
  receiverRfc: string | null;
  content: InvoiceBulkDownloadContent;
  includePayments: boolean;
  includeCancelled: boolean;
  invoiceCount: number;
  paymentCount: number;
  filesTotal: number;
  filesDone: number;
  warningsCount: number;
  warnings: InvoiceBulkDownloadWarning[];
  parts: InvoiceBulkDownloadPart[];
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
}

export function isInvoiceBulkDownloadActive(
  status: InvoiceBulkDownloadStatus,
): boolean {
  return status === "queued" || status === "processing";
}

export function isInvoiceBulkDownloadReady(
  status: InvoiceBulkDownloadStatus,
): boolean {
  return status === "completed" || status === "completed_with_errors";
}
