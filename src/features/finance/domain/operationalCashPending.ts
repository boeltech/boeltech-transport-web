/**
 * Bandeja «Efectivo por cobrar» — GET /trips/operational-cash-pending (ADR-0096 addendum).
 * Solo lectura; escritura sigue en Costos del viaje.
 */

import type { OperationalCashCollectionStatus } from "@features/trips/domain";

export type OperationalCashPendingTripStatus =
  | "scheduled"
  | "in_progress"
  | "completed";

export interface OperationalCashPendingCash {
  status: OperationalCashCollectionStatus;
  collectedTotal: number;
  pendingAmount: number;
  receiptCount: number;
}

export interface OperationalCashPendingTrip {
  id: string;
  code: string;
  status: OperationalCashPendingTripStatus;
  clientId: string | null;
  clientName: string | null;
  baseRate: number;
  scheduledDeparture: string;
  operationalCash: OperationalCashPendingCash;
}

export interface OperationalCashPendingByClient {
  clientId: string | null;
  clientName: string | null;
  pendingAmount: number;
  tripCount: number;
}

export interface OperationalCashPendingTotals {
  pendingAmount: number;
  tripCount: number;
  clientCount: number;
}

export interface OperationalCashPendingEligibility {
  intent: "sin_cfdi_efectivo";
  pendingGt: number;
  statuses: OperationalCashPendingTripStatus[];
}

export interface OperationalCashPendingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OperationalCashPendingResult {
  data: OperationalCashPendingTrip[];
  meta: {
    totals: OperationalCashPendingTotals;
    byClient: OperationalCashPendingByClient[];
    eligibility: OperationalCashPendingEligibility;
  };
  pagination: OperationalCashPendingPagination;
}

export interface OperationalCashPendingQueryParams {
  clientId?: string | null;
  page?: number;
  limit?: number;
}

/** Query param deep-link desde card cliente (F3). */
export const FINANCE_EFECTIVO_CLIENT_ID_PARAM = "clientId";

export const OPERATIONAL_CASH_PENDING_PAGE_SIZE = 20;
