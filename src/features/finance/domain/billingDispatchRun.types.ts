/** ADR-0082 — corridas de despacho de facturas. */

export const DISPATCH_RUN_STATUSES = [
  "draft",
  "previewed",
  "send_confirmed",
  "sending",
  "completed",
  "failed",
  "cancelled",
] as const;

export type DispatchRunStatus = (typeof DISPATCH_RUN_STATUSES)[number];

/** ADR-0083 — disparo humano vs job programado. */
export const DISPATCH_RUN_ORIGINS = ["manual", "scheduled"] as const;

export type DispatchRunOrigin = (typeof DISPATCH_RUN_ORIGINS)[number];

export const DISPATCH_ITEM_KINDS = ["pending_stamp", "ready_to_send"] as const;

export type DispatchItemKind = (typeof DISPATCH_ITEM_KINDS)[number];

export type DispatchRecipientKind = "billing_email" | "contact";

/** Destinatario elegible / snapshot (addendum destinatarios). */
export interface DispatchRecipient {
  key: string;
  kind: DispatchRecipientKind;
  contactId?: string;
  label: string;
  email: string;
}

export interface RecipientsByClient {
  clientId: string;
  clientName: string;
  recipients: DispatchRecipient[];
}

export interface BillingDispatchClientReceipt {
  clientId: string;
  recipients: DispatchRecipient[];
  emailMessageId: string | null;
  status: "sent" | "failed";
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientOverrideEntry {
  clientId: string;
  recipientKeys: string[];
}

export interface BillingDispatchRunSummary {
  pendingStampCount: number;
  readyToSendCount: number;
  alreadySentSkipped: number;
}

export interface BillingDispatchRunItem {
  id: string;
  itemKind: DispatchItemKind;
  tripId: string | null;
  invoiceId: string | null;
  billingScope: string | null;
  clientId: string;
  clientName?: string | null;
  /** RFC (`tax_id`) del cliente, si la API lo enriqueció. */
  clientRfc?: string | null;
  status: string;
  folio?: string | null;
  emailMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingDispatchRun {
  id: string;
  tenantId: string;
  billingSchemeId: string | null;
  periodStart: string;
  periodEnd: string;
  anchorKind: string;
  origin: DispatchRunOrigin;
  status: DispatchRunStatus;
  previewedAt: string | null;
  sendConfirmedAt: string | null;
  sendConfirmedBy: string | null;
  completedAt: string | null;
  failedAt: string | null;
  errorSummary: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  summary?: BillingDispatchRunSummary;
  items?: BillingDispatchRunItem[];
  /** Elegibles live del maestro (clientes con ready_to_send). */
  recipientsByClient?: RecipientsByClient[];
  /** Snapshot post-send; null si aún no hay receipts. */
  clientReceipts?: BillingDispatchClientReceipt[] | null;
}

export interface BillingDispatchRunListItem {
  id: string;
  billingSchemeId: string | null;
  periodStart: string;
  periodEnd: string;
  origin: DispatchRunOrigin;
  status: DispatchRunStatus;
  previewedAt: string | null;
  sendConfirmedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateBillingDispatchRunPayload {
  billingSchemeId: string;
  autoPreview?: boolean;
  referenceAt?: string;
}

export interface ConfirmSendDispatchRunPayload {
  forceResend?: boolean;
  invoiceIds?: string[];
  /** Solo clientes con subset ≠ all elegibles (compat A1). */
  recipientOverrides?: RecipientOverrideEntry[];
}
