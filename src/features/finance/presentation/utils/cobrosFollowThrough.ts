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
  /** ISO timestamp when the snapshot was written (F2 lifecycle). */
  readonly recordedAt?: string;
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
  const recordedAt =
    typeof value.recordedAt === "string" ? value.recordedAt : undefined;
  return {
    paymentId: value.paymentId,
    receiverRfc: value.receiverRfc,
    amount: value.amount,
    paymentDate: value.paymentDate,
    repStatus: value.repStatus,
    invoices,
    ...(recordedAt ? { recordedAt } : {}),
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
    recordedAt: new Date().toISOString(),
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

export function clearCobrosFollowThrough(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
  } catch {
    // Private mode: ignore; caller still clears React state.
  }
}

/** Grace before treating “absent from exceptions” as resolved (stale cache / indexing). */
export const COBROS_FOLLOW_THROUGH_ABSENCE_GRACE_MS = 3_000;

/**
 * Banner lifecycle (issue #33 F2): clear when REP is stamped, or when the
 * payment left the exceptions bucket after we already observed it there, or
 * after a short grace when a return visit finds it gone (stamp completed).
 */
export function shouldClearCobrosFollowThrough(
  followThrough: CobrosFollowThrough,
  live: {
    readonly exceptionsFetched: boolean;
    readonly exceptionPaymentIds: ReadonlySet<string> | readonly string[];
    /** True when the fetched page may omit the payment (pagination). */
    readonly exceptionsMayBeIncomplete?: boolean;
    /** True once this paymentId appeared in a successful exceptions fetch. */
    readonly previouslySeenInExceptions: boolean;
    /** Clock for grace window tests; defaults to Date.now(). */
    readonly nowMs?: number;
  },
): boolean {
  if (followThrough.repStatus === "stamped") return true;
  if (!live.exceptionsFetched) return false;
  if (live.exceptionsMayBeIncomplete) return false;
  const ids =
    live.exceptionPaymentIds instanceof Set
      ? live.exceptionPaymentIds
      : new Set(live.exceptionPaymentIds);
  if (ids.has(followThrough.paymentId)) return false;
  if (live.previouslySeenInExceptions) return true;
  if (!followThrough.recordedAt) return false;
  const recordedMs = Date.parse(followThrough.recordedAt);
  if (Number.isNaN(recordedMs)) return false;
  const nowMs = live.nowMs ?? Date.now();
  return nowMs - recordedMs >= COBROS_FOLLOW_THROUGH_ABSENCE_GRACE_MS;
}
