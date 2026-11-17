/**
 * Client Contact & History Mappers (WS-B)
 */

import { mapSingleResponse, type ApiSingleResponse, type DeepCamelCase, deepToCamel } from "@shared/api";
import type {
  ClientContact,
  ClientSummary,
  ClientCreditSummary,
  ClientTripHistoryItem,
  CreditExposureStatus,
  PaymentTerms,
} from "../domain/entities";
import type {
  ClientContactApiResponse,
  ClientSummaryApiResponse,
  ClientCreditSummaryApiResponse,
  ClientTripHistoryItemApiResponse,
  CreateClientContactDTO,
  UpdateClientContactDTO,
  PaginatedResult,
} from "../domain/repository";

export function mapClientContactToDomain(
  raw: DeepCamelCase<ClientContactApiResponse>,
): ClientContact {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    clientId: raw.clientId,
    fullName: raw.fullName,
    position: raw.position ?? undefined,
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
    secondaryPhone: raw.secondaryPhone ?? undefined,
    signsCartaPorte: raw.signsCartaPorte,
    receivesInvoices: raw.receivesInvoices,
    authorizesPayments: raw.authorizesPayments,
    isPrimary: raw.isPrimary,
    isActive: raw.isActive,
    notes: raw.notes ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy ?? undefined,
    updatedBy: raw.updatedBy ?? undefined,
  };
}

export function mapClientContactList(
  response: ApiSingleResponse<ClientContactApiResponse[]>,
): ClientContact[] {
  const mapped = mapSingleResponse(response);
  return (mapped.data ?? []).map(mapClientContactToDomain);
}

export function mapClientContact(
  response: ApiSingleResponse<ClientContactApiResponse>,
): ClientContact {
  const mapped = mapSingleResponse(response);
  return mapClientContactToDomain(mapped.data);
}

export function toApiCreateClientContact(
  dto: CreateClientContactDTO,
): Record<string, unknown> {
  return {
    fullName: dto.fullName,
    position: dto.position ?? undefined,
    email: dto.email ?? undefined,
    phone: dto.phone ?? undefined,
    secondaryPhone: dto.secondaryPhone ?? undefined,
    signsCartaPorte: dto.signsCartaPorte ?? false,
    receivesInvoices: dto.receivesInvoices ?? false,
    authorizesPayments: dto.authorizesPayments ?? false,
    isPrimary: dto.isPrimary ?? false,
    notes: dto.notes ?? undefined,
  };
}

export function toApiUpdateClientContact(
  dto: UpdateClientContactDTO,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== undefined),
  );
}

export function mapClientSummary(
  response: ApiSingleResponse<ClientSummaryApiResponse>,
): ClientSummary {
  const mapped = mapSingleResponse(response);
  const d = mapped.data;
  return {
    activeTrips: d.activeTrips,
    totalTrips: d.totalTrips,
    excludedTrips: d.excludedTrips ?? 0,
    totalRevenue: d.totalRevenue,
    avgPaymentDays: d.avgPaymentDays,
    lastTripAt: d.lastTripAt,
  };
}

export function mapClientCreditSummary(
  response: ApiSingleResponse<ClientCreditSummaryApiResponse>,
): ClientCreditSummary {
  const mapped = mapSingleResponse(response);
  const d = mapped.data;
  return {
    clientId: d.clientId,
    paymentTerms: d.paymentTerms as PaymentTerms,
    creditDays: d.creditDays,
    creditLimit: d.creditLimit,
    breakdown: {
      invoiced: d.breakdown.invoiced,
      unbilled: d.breakdown.unbilled,
      pendingDraft: d.breakdown.pendingDraft,
      operationalPending: d.breakdown.operationalPending ?? 0,
    },
    totalExposure: d.totalExposure,
    availableCredit: d.availableCredit,
    utilizationPct: d.utilizationPct,
    status: d.status as CreditExposureStatus,
    nextInvoiceDueAt: d.nextInvoiceDueAt,
  };
}

function mapTripHistoryItem(
  raw: DeepCamelCase<ClientTripHistoryItemApiResponse>,
): ClientTripHistoryItem {
  return {
    tripId: raw.tripId,
    tripCode: raw.tripCode,
    status: raw.status,
    originLabel: raw.originLabel ?? null,
    destinationLabel: raw.destinationLabel ?? null,
    scheduledDeparture: raw.scheduledDeparture ?? null,
    revenue: raw.revenue,
    revenueSource: raw.revenueSource ?? null,
    projectedRevenue: raw.projectedRevenue,
    financialBucket: raw.financialBucket,
    invoiceStatus: raw.invoiceStatus,
  };
}

export function mapClientTripHistory(
  response: {
    data: ClientTripHistoryItemApiResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  },
): PaginatedResult<ClientTripHistoryItem> {
  return {
    data: response.data.map((row) =>
      mapTripHistoryItem(deepToCamel(row)),
    ),
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    },
  };
}

// ============================================================================
// Last-collection + by_channel mappers (F4)
// ============================================================================

import type {
  LastCollection,
  LastCollectionRef,
  ClientByChannel,
  ByChannelEntry,
  CollectionChannel,
} from "../domain/entities";

function parseLastCollectionRef(raw: Record<string, unknown>): LastCollectionRef {
  const channel = raw.channel as string;
  if (channel === "with_invoice") {
    return { channel: "with_invoice", paymentId: String(raw.payment_id ?? "") };
  }
  const kind = (raw.kind as string) ?? "batch";
  if (kind === "receipt") {
    return { channel: "without_invoice", kind: "receipt", receiptId: String(raw.receipt_id ?? "") };
  }
  return { channel: "without_invoice", kind: "batch", batchId: String(raw.batch_id ?? "") };
}

export function mapLastCollection(raw: unknown): LastCollection | null {
  if (raw == null) return null;
  const obj = raw as Record<string, unknown>;
  const ref = obj.ref != null
    ? parseLastCollectionRef(obj.ref as Record<string, unknown>)
    : parseLastCollectionRef(obj);
  return {
    channel: (obj.channel as CollectionChannel) ?? ref.channel,
    ref,
    amount: Number(obj.amount ?? 0),
    at: String(obj.at ?? ""),
    label: String(obj.label ?? ""),
  };
}

function mapByChannelEntry(raw: Record<string, unknown> | undefined): ByChannelEntry {
  if (!raw) return { balance: 0, count: 0, oldestAt: null };
  return {
    balance: Number(raw.balance ?? 0),
    count: Number(raw.count ?? 0),
    oldestAt: raw.oldest_at != null ? String(raw.oldest_at) : null,
  };
}

export function mapClientByChannel(raw: unknown): ClientByChannel {
  if (raw == null) {
    return {
      withInvoice: { balance: 0, count: 0, oldestAt: null },
      withoutInvoice: { balance: 0, count: 0, oldestAt: null },
    };
  }
  const obj = raw as Record<string, unknown>;
  return {
    withInvoice: mapByChannelEntry(obj.with_invoice as Record<string, unknown> | undefined),
    withoutInvoice: mapByChannelEntry(obj.without_invoice as Record<string, unknown> | undefined),
  };
}

export { mapClientContactToDomain as mapPrimaryContactFromApi };
