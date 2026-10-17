/**
 * Document expiry board — domain types (camelCase).
 * Contrato: GET /api/v1/fleet/document-expiries
 */

export const DocumentExpiryDocType = {
  INSURANCE: "insurance",
  SCT_PERMIT: "sct_permit",
  LICENSE: "license",
  MEDICAL_CERTIFICATE: "medical_certificate",
} as const;

export type DocumentExpiryDocTypeValue =
  (typeof DocumentExpiryDocType)[keyof typeof DocumentExpiryDocType];

export const DocumentExpiryStatus = {
  EXPIRED: "expired",
  EXPIRING: "expiring",
} as const;

export type DocumentExpiryStatusValue =
  (typeof DocumentExpiryStatus)[keyof typeof DocumentExpiryStatus];

export const DocumentExpiryEntityType = {
  VEHICLE: "vehicle",
  DRIVER: "driver",
} as const;

export type DocumentExpiryEntityTypeValue =
  (typeof DocumentExpiryEntityType)[keyof typeof DocumentExpiryEntityType];

export const DocumentExpirySeverity = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

export type DocumentExpirySeverityValue =
  (typeof DocumentExpirySeverity)[keyof typeof DocumentExpirySeverity];

export const DOCUMENT_EXPIRY_WITHIN_DAYS_OPTIONS = [30, 15, 7] as const;
export type DocumentExpiryWithinDays =
  (typeof DOCUMENT_EXPIRY_WITHIN_DAYS_OPTIONS)[number];

export const DOCUMENT_EXPIRY_DEFAULT_WITHIN_DAYS: DocumentExpiryWithinDays = 30;

export interface DocumentExpiryItem {
  entityType: DocumentExpiryEntityTypeValue;
  entityId: string;
  entityLabel: string;
  docType: DocumentExpiryDocTypeValue;
  expiresOn: string | null;
  daysRemaining: number | null;
  severity: DocumentExpirySeverityValue;
}

export interface DocumentExpiryQueryParams {
  page?: number;
  limit?: number;
  withinDays?: number;
  docType?: DocumentExpiryDocTypeValue;
  status?: DocumentExpiryStatusValue;
}

export const fleetDocumentsQueryKeys = {
  all: ["fleet-documents"] as const,
  lists: () => [...fleetDocumentsQueryKeys.all, "list"] as const,
  list: (params?: DocumentExpiryQueryParams) =>
    [...fleetDocumentsQueryKeys.lists(), params] as const,
} as const;

export const FLEET_DOCUMENTS_PATH = "/fleet/documents";
