/**
 * Client Contact & History Mappers (WS-B)
 */

import { mapSingleResponse, type ApiSingleResponse, type DeepCamelCase, deepToCamel } from "@shared/api";
import type {
  ClientContact,
  ClientSummary,
  ClientTripHistoryItem,
} from "../domain/entities";
import type {
  ClientContactApiResponse,
  ClientSummaryApiResponse,
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

export { mapClientContactToDomain as mapPrimaryContactFromApi };
