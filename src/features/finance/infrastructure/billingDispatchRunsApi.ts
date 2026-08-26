import {
  apiClient,
  mapPaginatedResponse,
  mapSingleResponse,
  type ApiPaginatedResponse,
  type ApiSingleResponse,
  type DeepCamelCase,
} from "@shared/api";
import type {
  BillingDispatchClientReceipt,
  BillingDispatchRun,
  BillingDispatchRunItem,
  BillingDispatchRunListItem,
  BillingDispatchRunSummary,
  ConfirmSendDispatchRunPayload,
  CreateBillingDispatchRunPayload,
  DispatchItemKind,
  DispatchRecipient,
  DispatchRecipientKind,
  DispatchRunOrigin,
  DispatchRunStatus,
  RecipientsByClient,
} from "../domain/billingDispatchRun.types";

const BASE = "/billing-dispatch-runs";

type ApiRecipientRaw = {
  key: string;
  kind: string;
  contact_id?: string;
  label: string;
  email: string;
};

type ApiRecipientsByClientRaw = {
  client_id: string;
  client_name: string;
  recipients: ApiRecipientRaw[];
};

type ApiClientReceiptRaw = {
  client_id: string;
  recipients: ApiRecipientRaw[];
  email_message_id: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type ApiRunItemRaw = {
  id: string;
  item_kind: string;
  trip_id: string | null;
  invoice_id: string | null;
  billing_scope: string | null;
  client_id: string;
  client_name?: string | null;
  client_rfc?: string | null;
  status: string;
  folio?: string | null;
  email_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type ApiRunRaw = {
  id: string;
  tenant_id: string;
  billing_scheme_id: string | null;
  period_start: string;
  period_end: string;
  anchor_kind: string;
  origin?: string;
  status: string;
  previewed_at: string | null;
  send_confirmed_at: string | null;
  send_confirmed_by: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_summary: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  summary?: {
    pending_stamp_count: number;
    ready_to_send_count: number;
    already_sent_skipped: number;
  };
  items?: ApiRunItemRaw[];
  recipients_by_client?: ApiRecipientsByClientRaw[];
  client_receipts?: ApiClientReceiptRaw[] | null;
};

function mapRecipient(
  raw: DeepCamelCase<ApiRecipientRaw>,
): DispatchRecipient {
  return {
    key: raw.key,
    kind: raw.kind as DispatchRecipientKind,
    contactId: raw.contactId,
    label: raw.label,
    email: raw.email,
  };
}

function mapRecipientsByClient(
  raw: DeepCamelCase<ApiRecipientsByClientRaw>,
): RecipientsByClient {
  return {
    clientId: raw.clientId,
    clientName: raw.clientName,
    recipients: (raw.recipients ?? []).map((r) =>
      mapRecipient(r as DeepCamelCase<ApiRecipientRaw>),
    ),
  };
}

function mapClientReceipt(
  raw: DeepCamelCase<ApiClientReceiptRaw>,
): BillingDispatchClientReceipt {
  return {
    clientId: raw.clientId,
    recipients: (raw.recipients ?? []).map((r) =>
      mapRecipient(r as DeepCamelCase<ApiRecipientRaw>),
    ),
    emailMessageId: raw.emailMessageId,
    status: raw.status === "failed" ? "failed" : "sent",
    errorMessage: raw.errorMessage,
    sentAt: raw.sentAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapSummary(
  raw: DeepCamelCase<NonNullable<ApiRunRaw["summary"]>>,
): BillingDispatchRunSummary {
  return {
    pendingStampCount: raw.pendingStampCount,
    readyToSendCount: raw.readyToSendCount,
    alreadySentSkipped: raw.alreadySentSkipped,
  };
}

function mapItem(
  raw: DeepCamelCase<ApiRunItemRaw>,
): BillingDispatchRunItem {
  return {
    id: raw.id,
    itemKind: raw.itemKind as DispatchItemKind,
    tripId: raw.tripId,
    invoiceId: raw.invoiceId,
    billingScope: raw.billingScope,
    clientId: raw.clientId,
    clientName: raw.clientName ?? undefined,
    clientRfc: raw.clientRfc ?? undefined,
    status: raw.status,
    folio: raw.folio ?? undefined,
    emailMessageId: raw.emailMessageId,
    errorMessage: raw.errorMessage,
    sentAt: raw.sentAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapBillingDispatchRun(
  raw: DeepCamelCase<ApiRunRaw>,
): BillingDispatchRun {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    billingSchemeId: raw.billingSchemeId,
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
    anchorKind: raw.anchorKind,
    origin: (raw.origin ?? "manual") as DispatchRunOrigin,
    status: raw.status as DispatchRunStatus,
    previewedAt: raw.previewedAt,
    sendConfirmedAt: raw.sendConfirmedAt,
    sendConfirmedBy: raw.sendConfirmedBy,
    completedAt: raw.completedAt,
    failedAt: raw.failedAt,
    errorSummary: raw.errorSummary,
    createdBy: raw.createdBy,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    summary: raw.summary ? mapSummary(raw.summary) : undefined,
    items: raw.items?.map((item) =>
      mapItem(item as DeepCamelCase<ApiRunItemRaw>),
    ),
    recipientsByClient: raw.recipientsByClient?.map((group) =>
      mapRecipientsByClient(group as DeepCamelCase<ApiRecipientsByClientRaw>),
    ),
    clientReceipts:
      raw.clientReceipts == null
        ? raw.clientReceipts
        : raw.clientReceipts.map((row) =>
            mapClientReceipt(row as DeepCamelCase<ApiClientReceiptRaw>),
          ),
  };
}

function mapListItem(
  raw: DeepCamelCase<Omit<ApiRunRaw, "summary" | "items">>,
): BillingDispatchRunListItem {
  return {
    id: raw.id,
    billingSchemeId: raw.billingSchemeId,
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
    origin: (raw.origin ?? "manual") as DispatchRunOrigin,
    status: raw.status as DispatchRunStatus,
    previewedAt: raw.previewedAt,
    sendConfirmedAt: raw.sendConfirmedAt,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt,
  };
}

export async function fetchBillingDispatchRuns(params?: {
  status?: DispatchRunStatus;
  billingSchemeId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  data: BillingDispatchRunListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const response = await apiClient.get<ApiPaginatedResponse<ApiRunRaw>>(BASE, {
    params: {
      status: params?.status,
      billing_scheme_id: params?.billingSchemeId,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    },
  });
  const { data, pagination } = mapPaginatedResponse(response);
  return {
    data: data.map((row) =>
      mapListItem(row as DeepCamelCase<Omit<ApiRunRaw, "summary" | "items">>),
    ),
    pagination,
  };
}

export async function fetchBillingDispatchRunById(
  id: string,
): Promise<BillingDispatchRun> {
  const response = await apiClient.get<ApiSingleResponse<ApiRunRaw>>(
    `${BASE}/${id}`,
  );
  const { data } = mapSingleResponse(response);
  return mapBillingDispatchRun(data as DeepCamelCase<ApiRunRaw>);
}

export async function createBillingDispatchRun(
  payload: CreateBillingDispatchRunPayload,
): Promise<BillingDispatchRun> {
  const response = await apiClient.post<ApiSingleResponse<ApiRunRaw>>(BASE, {
    billing_scheme_id: payload.billingSchemeId,
    auto_preview: payload.autoPreview ?? true,
    reference_at: payload.referenceAt,
  });
  const { data } = mapSingleResponse(response);
  return mapBillingDispatchRun(data as DeepCamelCase<ApiRunRaw>);
}

export async function previewBillingDispatchRun(
  id: string,
): Promise<BillingDispatchRun> {
  const response = await apiClient.post<ApiSingleResponse<ApiRunRaw>>(
    `${BASE}/${id}/preview`,
  );
  const { data } = mapSingleResponse(response);
  return mapBillingDispatchRun(data as DeepCamelCase<ApiRunRaw>);
}

export async function confirmSendBillingDispatchRun(
  id: string,
  payload?: ConfirmSendDispatchRunPayload,
): Promise<BillingDispatchRun> {
  const body: Record<string, unknown> = {};
  if (payload?.forceResend === true) {
    body.force_resend = true;
    body.invoice_ids = payload.invoiceIds;
  }
  if (payload?.recipientOverrides?.length) {
    body.recipient_overrides = payload.recipientOverrides.map((entry) => ({
      client_id: entry.clientId,
      recipient_keys: entry.recipientKeys,
    }));
  }
  const response = await apiClient.post<ApiSingleResponse<ApiRunRaw>>(
    `${BASE}/${id}/confirm-send`,
    body,
  );
  const { data } = mapSingleResponse(response);
  return mapBillingDispatchRun(data as DeepCamelCase<ApiRunRaw>);
}

export async function cancelBillingDispatchRun(
  id: string,
): Promise<BillingDispatchRun> {
  const response = await apiClient.post<ApiSingleResponse<ApiRunRaw>>(
    `${BASE}/${id}/cancel`,
  );
  const { data } = mapSingleResponse(response);
  return mapBillingDispatchRun(data as DeepCamelCase<ApiRunRaw>);
}
