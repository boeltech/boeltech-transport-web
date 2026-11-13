/**
 * Cobro por lote — Sin factura (ADR-0096 addendum B2).
 * Contrato F2: candidates / create / get / list / void.
 */

import type { OperationalPaymentInstrument } from "@boeltech/cfdi-domain";

export type { OperationalPaymentInstrument };

export const OPERATIONAL_PAYMENT_INSTRUMENT_LABELS: Record<
  OperationalPaymentInstrument,
  string
> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  check: "Cheque",
  other: "Otro",
};

export interface OperationalReceiptBatchCandidate {
  tripId: string;
  tripCode: string;
  status: "scheduled" | "in_progress" | "completed";
  scheduledDeparture: string | null;
  baseRate: number;
  collectedTotal: number;
  pendingAmount: number;
}

export interface OperationalReceiptBatchCandidatesResult {
  data: OperationalReceiptBatchCandidate[];
  meta: {
    totals: { pendingAmount: number; tripCount: number };
    batchCount: number;
    truncated: boolean;
  };
}

export interface OperationalReceiptBatchReceiptLine {
  id: string;
  tripId: string;
  tripCode: string;
  tripStatus: string;
  scheduledDeparture: string | null;
  amount: number;
  voidedAt: string | null;
}

export interface OperationalReceiptBatchDetail {
  id: string;
  clientId: string;
  clientName: string | null;
  amount: number;
  paymentInstrument: OperationalPaymentInstrument;
  reference: string | null;
  collectedAt: string;
  note: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  voidedAt: string | null;
  voidedBy: string | null;
  voidedByName: string | null;
  voidReason: string | null;
  receiptCount: number;
  receipts: OperationalReceiptBatchReceiptLine[];
}

/** Listado: BatchDetail sin receipts. */
export type OperationalReceiptBatchSummary = Omit<
  OperationalReceiptBatchDetail,
  "receipts"
>;

export interface OperationalReceiptBatchListResult {
  data: OperationalReceiptBatchSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateOperationalReceiptBatchAllocation {
  tripId: string;
  amount: number;
  expectedPendingAmount: number;
}

export interface CreateOperationalReceiptBatchInput {
  amount: number;
  paymentInstrument: OperationalPaymentInstrument;
  reference?: string | null;
  collectedAt: string;
  note?: string | null;
  idempotencyKey: string;
  allocations: CreateOperationalReceiptBatchAllocation[];
}

export interface VoidOperationalReceiptBatchInput {
  reason: string;
}

/** Etiqueta humana del lote (sin folio en B2). */
export function formatOperationalReceiptBatchLabel(input: {
  collectedAt: string;
  paymentInstrument: OperationalPaymentInstrument;
  reference?: string | null;
  formatDate: (iso: string) => string;
}): string {
  const instrument =
    OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[input.paymentInstrument] ??
    input.paymentInstrument;
  const date = input.formatDate(input.collectedAt);
  const ref = input.reference?.trim();
  return ref
    ? `Lote del ${date} · ${instrument} · ${ref}`
    : `Lote del ${date} · ${instrument}`;
}
