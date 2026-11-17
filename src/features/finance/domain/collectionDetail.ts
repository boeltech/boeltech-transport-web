/**
 * Detalle unificado del cobro (F3 · TEC §D.1).
 * Discriminante: payment | batch | receipt (legacy).
 */

import type { OperationalPaymentInstrument } from "./operationalReceiptBatch";
import type { FinanceRepLiveStatus, FinanceRepWaitReason } from "./entities";

export type CollectionChannel = "with_invoice" | "without_invoice";

export type CollectionDetailTarget =
  | { kind: "payment"; paymentId: string }
  | { kind: "batch"; batchId: string }
  | { kind: "receipt"; receiptId: string };

export interface CollectionComprobanteEmits {
  emits: true;
  repStatus: FinanceRepLiveStatus;
  repSerieFolio: string | null;
  repUuid: string | null;
  stampedAt: string | null;
  lastError: string | null;
  repAttempts: number;
  fiscalDeadline: { date: string; status: string } | null;
  waitReason: FinanceRepWaitReason | string | null;
  blockingPaymentId: string | null;
  dispatchSentAt: string | null;
}

export interface CollectionComprobanteSilent {
  emits: false;
}

export type CollectionComprobante =
  | CollectionComprobanteEmits
  | CollectionComprobanteSilent;

export interface PaymentCollectionAllocation {
  id: string;
  ingressInvoiceId: string;
  amount: number;
  currency: string;
  serie: string | null;
  folio: number | null;
  receiverName: string | null;
  repNumParcialidad: number | null;
  repImpSaldoAnt: number | null;
  repImpSaldoInsoluto: number | null;
}

/** GET /payments/:paymentId */
export interface PaymentCollectionDetail {
  channel: "with_invoice";
  id: string;
  clientId: string | null;
  clientName: string | null;
  amount: number;
  currency: string;
  amountMxn: number;
  paymentDate: string;
  paymentTime: string;
  paymentForm: string;
  paymentFormName: string | null;
  reference: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
  status: FinanceRepLiveStatus | string;
  allocations: PaymentCollectionAllocation[];
  comprobante: CollectionComprobanteEmits;
}

/** GET /operational-cash-receipts/:receiptId (legacy unitario). */
export interface ReceiptCollectionDetail {
  channel: "without_invoice";
  kind: "receipt";
  id: string;
  tripId: string;
  amount: number;
  collectedAt: string;
  note: string | null;
  paymentInstrument: OperationalPaymentInstrument;
  reference: string | null;
  batchId: string | null;
  createdBy: string;
  createdAt: string;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  comprobante: CollectionComprobanteSilent;
}
