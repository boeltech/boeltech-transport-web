import type { FinanceInvoiceListItem, FinancePayment } from "@features/finance/domain";
import type { RegisterFinancePaymentPayload } from "@features/finance/infrastructure/financePaymentsApi";

export const COBROS_FOLLOW_THROUGH_STORAGE_KEY = "finance.cobros.followThrough";

export interface CobrosFollowThroughInvoice {
  readonly id: string;
  readonly serie: string;
  readonly folio: number;
  readonly amount: number;
}

export interface CobrosFollowThrough {
  readonly paymentId: string;
  readonly receiverRfc: string;
  readonly amount: number;
  readonly paymentDate: string;
  readonly repStatus: string;
  readonly invoices: CobrosFollowThroughInvoice[];
}

function isFollowThroughInvoice(value: unknown): value is CobrosFollowThroughInvoice {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.serie === "string" &&
    typeof item.folio === "number" &&
    typeof item.amount === "number"
  );
}

export function parseCobrosFollowThrough(raw: unknown): CobrosFollowThrough | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (
    typeof value.paymentId !== "string" ||
    typeof value.receiverRfc !== "string" ||
    typeof value.amount !== "number" ||
    typeof value.paymentDate !== "string" ||
    typeof value.repStatus !== "string" ||
    !Array.isArray(value.invoices)
  ) {
    return null;
  }
  const invoices = value.invoices.filter(isFollowThroughInvoice);
  if (invoices.length === 0) return null;
  return {
    paymentId: value.paymentId,
    receiverRfc: value.receiverRfc,
    amount: value.amount,
    paymentDate: value.paymentDate,
    repStatus: value.repStatus,
    invoices,
  };
}

export function buildCobrosFollowThrough(
  payment: FinancePayment,
  payload: RegisterFinancePaymentPayload,
  invoices: FinanceInvoiceListItem[],
): CobrosFollowThrough {
  const amountByInvoiceId = new Map(
    payload.allocations.map((allocation) => [
      allocation.ingressInvoiceId,
      allocation.amount,
    ]),
  );
  return {
    paymentId: payment.id,
    receiverRfc: payload.receiverRfc,
    amount: payload.amount,
    paymentDate: payload.paymentDate,
    repStatus: payment.repStatus,
    invoices: invoices.map((invoice) => ({
      id: invoice.id,
      serie: invoice.serie,
      folio: invoice.folio,
      amount: amountByInvoiceId.get(invoice.id) ?? invoice.balanceDue,
    })),
  };
}

export function readCobrosFollowThrough(): CobrosFollowThrough | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
    if (!raw) return null;
    return parseCobrosFollowThrough(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function writeCobrosFollowThrough(value: CobrosFollowThrough): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      COBROS_FOLLOW_THROUGH_STORAGE_KEY,
      JSON.stringify(value),
    );
  } catch {
    // Quota or private mode: the in-memory panel still covers this visit.
  }
}
