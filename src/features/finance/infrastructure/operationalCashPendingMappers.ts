/**
 * Mappers snake → camel para GET /trips/operational-cash-pending.
 */

import type {
  OperationalCashPendingByClient,
  OperationalCashPendingEligibility,
  OperationalCashPendingLastReceipt,
  OperationalCashPendingResult,
  OperationalCashPendingTotals,
  OperationalCashPendingTrip,
  OperationalCashPendingTripStatus,
} from "@features/finance/domain/operationalCashPending";
import type { OperationalCashCollectionStatus } from "@features/trips/domain";

export interface ApiOperationalCashPendingLastReceiptRaw {
  payment_instrument?: string;
  reference?: string | null;
  batch_id?: string | null;
  collected_at?: string;
}

export interface ApiOperationalCashPendingTripRaw {
  id: string;
  code: string;
  status: string;
  client_id: string | null;
  client_name: string | null;
  base_rate: number;
  scheduled_departure: string;
  operational_cash: {
    status: string;
    collected_total: number;
    pending_amount: number;
    receipt_count: number;
  };
  last_active_receipt?: ApiOperationalCashPendingLastReceiptRaw | null;
}

export interface ApiOperationalCashPendingByClientRaw {
  client_id: string | null;
  client_name: string | null;
  pending_amount: number;
  trip_count: number;
}

export interface ApiOperationalCashPendingResponseRaw {
  data: ApiOperationalCashPendingTripRaw[];
  meta: {
    totals: {
      pending_amount: number;
      trip_count: number;
      client_count: number;
    };
    by_client: ApiOperationalCashPendingByClientRaw[];
    eligibility: {
      intent: string;
      pending_gt: number;
      statuses: string[];
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

function asFiniteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asCashStatus(value: string): OperationalCashCollectionStatus {
  if (value === "partial" || value === "collected" || value === "pending") {
    return value;
  }
  return "pending";
}

function asTripStatus(value: string): OperationalCashPendingTripStatus {
  if (
    value === "scheduled" ||
    value === "in_progress" ||
    value === "completed"
  ) {
    return value;
  }
  return "scheduled";
}

function asInstrument(
  value: string | undefined,
): OperationalCashPendingLastReceipt["paymentInstrument"] {
  if (
    value === "cash" ||
    value === "transfer" ||
    value === "check" ||
    value === "other"
  ) {
    return value;
  }
  return "cash";
}

function mapLastActiveReceipt(
  raw: ApiOperationalCashPendingLastReceiptRaw | null | undefined,
): OperationalCashPendingLastReceipt | null {
  if (!raw) return null;
  return {
    paymentInstrument: asInstrument(raw.payment_instrument),
    reference: raw.reference ?? null,
    batchId: raw.batch_id ?? null,
    collectedAt: String(raw.collected_at ?? ""),
  };
}

export function mapOperationalCashPendingTrip(
  raw: ApiOperationalCashPendingTripRaw,
): OperationalCashPendingTrip {
  const cash = raw.operational_cash ?? {
    status: "pending",
    collected_total: 0,
    pending_amount: 0,
    receipt_count: 0,
  };
  return {
    id: String(raw.id ?? ""),
    code: String(raw.code ?? ""),
    status: asTripStatus(String(raw.status ?? "")),
    clientId: raw.client_id == null ? null : String(raw.client_id),
    clientName: raw.client_name == null ? null : String(raw.client_name),
    baseRate: asFiniteNumber(raw.base_rate, 0),
    scheduledDeparture: String(raw.scheduled_departure ?? ""),
    operationalCash: {
      status: asCashStatus(String(cash.status ?? "pending")),
      collectedTotal: asFiniteNumber(cash.collected_total, 0),
      pendingAmount: asFiniteNumber(cash.pending_amount, 0),
      receiptCount: asFiniteNumber(cash.receipt_count, 0),
    },
    lastActiveReceipt: mapLastActiveReceipt(raw.last_active_receipt),
  };
}

export function mapOperationalCashPendingByClient(
  raw: ApiOperationalCashPendingByClientRaw,
): OperationalCashPendingByClient {
  return {
    clientId: raw.client_id == null ? null : String(raw.client_id),
    clientName: raw.client_name == null ? null : String(raw.client_name),
    pendingAmount: asFiniteNumber(raw.pending_amount, 0),
    tripCount: asFiniteNumber(raw.trip_count, 0),
  };
}

export function mapOperationalCashPendingTotals(
  raw: ApiOperationalCashPendingResponseRaw["meta"]["totals"],
): OperationalCashPendingTotals {
  return {
    pendingAmount: asFiniteNumber(raw?.pending_amount, 0),
    tripCount: asFiniteNumber(raw?.trip_count, 0),
    clientCount: asFiniteNumber(raw?.client_count, 0),
  };
}

export function mapOperationalCashPendingEligibility(
  raw: ApiOperationalCashPendingResponseRaw["meta"]["eligibility"],
): OperationalCashPendingEligibility {
  const statuses = Array.isArray(raw?.statuses)
    ? raw.statuses
        .map((s) => asTripStatus(String(s)))
        .filter(
          (s, i, arr): s is OperationalCashPendingTripStatus =>
            arr.indexOf(s) === i,
        )
    : (["scheduled", "in_progress", "completed"] as OperationalCashPendingTripStatus[]);
  return {
    intent: "sin_cfdi_efectivo",
    pendingGt: asFiniteNumber(raw?.pending_gt, 0),
    statuses,
  };
}

export function mapOperationalCashPendingResponse(
  raw: ApiOperationalCashPendingResponseRaw,
): OperationalCashPendingResult {
  const page = Math.max(1, asFiniteNumber(raw.pagination?.page, 1));
  const limit = Math.max(1, asFiniteNumber(raw.pagination?.limit, 20));
  const total = Math.max(0, asFiniteNumber(raw.pagination?.total, 0));
  const totalPages = Math.max(
    1,
    asFiniteNumber(
      raw.pagination?.total_pages,
      Math.ceil(total / limit) || 1,
    ),
  );

  return {
    data: Array.isArray(raw.data)
      ? raw.data.map(mapOperationalCashPendingTrip)
      : [],
    meta: {
      totals: mapOperationalCashPendingTotals(raw.meta?.totals),
      byClient: Array.isArray(raw.meta?.by_client)
        ? raw.meta.by_client.map(mapOperationalCashPendingByClient)
        : [],
      eligibility: mapOperationalCashPendingEligibility(raw.meta?.eligibility),
    },
    pagination: { page, limit, total, totalPages },
  };
}
