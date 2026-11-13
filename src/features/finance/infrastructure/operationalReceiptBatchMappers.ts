/**
 * Mappers snake → camel — cobro por lote (B2).
 */

import type { OperationalPaymentInstrument } from "@boeltech/cfdi-domain";
import type {
  OperationalReceiptBatchCandidate,
  OperationalReceiptBatchCandidatesResult,
  OperationalReceiptBatchDetail,
  OperationalReceiptBatchListResult,
  OperationalReceiptBatchReceiptLine,
  OperationalReceiptBatchSummary,
} from "@features/finance/domain/operationalReceiptBatch";

export interface ApiOperationalReceiptBatchCandidateRaw {
  trip_id: string;
  trip_code: string;
  status: string;
  scheduled_departure: string | null;
  base_rate: number;
  collected_total: number;
  pending_amount: number;
}

export interface ApiOperationalReceiptBatchCandidatesRaw {
  data: ApiOperationalReceiptBatchCandidateRaw[];
  meta: {
    totals: { pending_amount: number; trip_count: number };
    batch_count: number;
    truncated: boolean;
  };
}

export interface ApiOperationalReceiptBatchReceiptRaw {
  id: string;
  trip_id: string;
  trip_code: string;
  trip_status: string;
  scheduled_departure: string | null;
  amount: number;
  voided_at: string | null;
}

export interface ApiOperationalReceiptBatchDetailRaw {
  id: string;
  client_id: string;
  client_name: string | null;
  amount: number;
  payment_instrument: string;
  reference: string | null;
  collected_at: string;
  note: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
  voided_at: string | null;
  voided_by: string | null;
  voided_by_name: string | null;
  void_reason: string | null;
  receipt_count: number;
  receipts?: ApiOperationalReceiptBatchReceiptRaw[];
}

function asFiniteNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asInstrument(value: string): OperationalPaymentInstrument {
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

function asCandidateStatus(
  value: string,
): OperationalReceiptBatchCandidate["status"] {
  if (
    value === "scheduled" ||
    value === "in_progress" ||
    value === "completed"
  ) {
    return value;
  }
  return "scheduled";
}

export function mapOperationalReceiptBatchCandidate(
  raw: ApiOperationalReceiptBatchCandidateRaw,
): OperationalReceiptBatchCandidate {
  return {
    tripId: String(raw.trip_id ?? ""),
    tripCode: String(raw.trip_code ?? ""),
    status: asCandidateStatus(String(raw.status ?? "")),
    scheduledDeparture:
      raw.scheduled_departure == null
        ? null
        : String(raw.scheduled_departure),
    baseRate: asFiniteNumber(raw.base_rate, 0),
    collectedTotal: asFiniteNumber(raw.collected_total, 0),
    pendingAmount: asFiniteNumber(raw.pending_amount, 0),
  };
}

export function mapOperationalReceiptBatchCandidates(
  raw: ApiOperationalReceiptBatchCandidatesRaw,
): OperationalReceiptBatchCandidatesResult {
  return {
    data: Array.isArray(raw.data)
      ? raw.data.map(mapOperationalReceiptBatchCandidate)
      : [],
    meta: {
      totals: {
        pendingAmount: asFiniteNumber(raw.meta?.totals?.pending_amount, 0),
        tripCount: asFiniteNumber(raw.meta?.totals?.trip_count, 0),
      },
      batchCount: asFiniteNumber(raw.meta?.batch_count, 0),
      truncated: Boolean(raw.meta?.truncated),
    },
  };
}

function mapReceiptLine(
  raw: ApiOperationalReceiptBatchReceiptRaw,
): OperationalReceiptBatchReceiptLine {
  return {
    id: String(raw.id ?? ""),
    tripId: String(raw.trip_id ?? ""),
    tripCode: String(raw.trip_code ?? ""),
    tripStatus: String(raw.trip_status ?? ""),
    scheduledDeparture:
      raw.scheduled_departure == null
        ? null
        : String(raw.scheduled_departure),
    amount: asFiniteNumber(raw.amount, 0),
    voidedAt: raw.voided_at == null ? null : String(raw.voided_at),
  };
}

function mapBatchCore(
  raw: ApiOperationalReceiptBatchDetailRaw,
): Omit<OperationalReceiptBatchDetail, "receipts"> {
  return {
    id: String(raw.id ?? ""),
    clientId: String(raw.client_id ?? ""),
    clientName: raw.client_name == null ? null : String(raw.client_name),
    amount: asFiniteNumber(raw.amount, 0),
    paymentInstrument: asInstrument(String(raw.payment_instrument ?? "cash")),
    reference: raw.reference == null ? null : String(raw.reference),
    collectedAt: String(raw.collected_at ?? ""),
    note: raw.note == null ? null : String(raw.note),
    createdBy: String(raw.created_by ?? ""),
    createdByName:
      raw.created_by_name == null ? null : String(raw.created_by_name),
    createdAt: String(raw.created_at ?? ""),
    voidedAt: raw.voided_at == null ? null : String(raw.voided_at),
    voidedBy: raw.voided_by == null ? null : String(raw.voided_by),
    voidedByName:
      raw.voided_by_name == null ? null : String(raw.voided_by_name),
    voidReason: raw.void_reason == null ? null : String(raw.void_reason),
    receiptCount: asFiniteNumber(raw.receipt_count, 0),
  };
}

export function mapOperationalReceiptBatchDetail(
  raw: ApiOperationalReceiptBatchDetailRaw,
): OperationalReceiptBatchDetail {
  return {
    ...mapBatchCore(raw),
    receipts: Array.isArray(raw.receipts)
      ? raw.receipts.map(mapReceiptLine)
      : [],
  };
}

export function mapOperationalReceiptBatchSummary(
  raw: ApiOperationalReceiptBatchDetailRaw,
): OperationalReceiptBatchSummary {
  return mapBatchCore(raw);
}

export function mapOperationalReceiptBatchList(raw: {
  data: ApiOperationalReceiptBatchDetailRaw[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}): OperationalReceiptBatchListResult {
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
      ? raw.data.map(mapOperationalReceiptBatchSummary)
      : [],
    pagination: { page, limit, total, totalPages },
  };
}
