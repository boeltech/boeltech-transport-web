import type { FinanceInvoiceListItem, FinancePayment } from "@features/finance/domain";
import type { RegisterFinancePaymentPayload } from "@features/finance/infrastructure/financePaymentsApi";

/** Legacy single-cobro key (v1) — migrated into the today tray. */
export const COBROS_FOLLOW_THROUGH_STORAGE_KEY = "finance.cobros.followThrough";

/** Session tray of cobros registered in this browser tab (v2). */
export const COBROS_TODAY_TRAY_STORAGE_KEY = "finance.cobros.todayTray.v2";

export const COBROS_TODAY_TRAY_MAX_IDS = 50;

export interface CobrosFollowThroughInvoice {
  readonly id: string;
  readonly serie: string;
  readonly folio: number;
  readonly amount: number;
}

/** One cobro in the «Cobros de hoy» tray (session snapshot + optional live fields). */
export interface CobrosTodayEntry {
  readonly paymentId: string;
  readonly receiverRfc: string;
  readonly amount: number;
  readonly paymentDate: string;
  readonly repStatus: string;
  readonly invoices: CobrosFollowThroughInvoice[];
  /** ISO timestamp when the snapshot was written. */
  readonly recordedAt: string;
}

/** @deprecated Prefer CobrosTodayEntry — kept for migration parsers. */
export type CobrosFollowThrough = CobrosTodayEntry & {
  readonly recordedAt?: string;
};

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

export function parseCobrosFollowThrough(raw: unknown): CobrosTodayEntry | null {
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
    typeof value.recordedAt === "string"
      ? value.recordedAt
      : new Date(0).toISOString();
  return {
    paymentId: value.paymentId,
    receiverRfc: value.receiverRfc,
    amount: value.amount,
    paymentDate: value.paymentDate,
    repStatus: value.repStatus,
    invoices,
    recordedAt,
  };
}

function parseCobrosTodayTray(raw: unknown): CobrosTodayEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: CobrosTodayEntry[] = [];
  for (const item of raw) {
    const parsed = parseCobrosFollowThrough(item);
    if (parsed) entries.push(parsed);
  }
  return entries;
}

export function buildCobrosFollowThrough(
  payment: FinancePayment,
  payload: RegisterFinancePaymentPayload,
  invoices: FinanceInvoiceListItem[],
): CobrosTodayEntry {
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

function migrateV1FollowThrough(): CobrosTodayEntry[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = parseCobrosFollowThrough(JSON.parse(raw) as unknown);
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
    return parsed ? [parsed] : [];
  } catch {
    return [];
  }
}

export function readCobrosTodayTray(): CobrosTodayEntry[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(COBROS_TODAY_TRAY_STORAGE_KEY);
    if (raw) {
      return parseCobrosTodayTray(JSON.parse(raw) as unknown);
    }
    const migrated = migrateV1FollowThrough();
    if (migrated.length > 0) {
      writeCobrosTodayTray(migrated);
    }
    return migrated;
  } catch {
    return migrateV1FollowThrough();
  }
}

export function writeCobrosTodayTray(entries: readonly CobrosTodayEntry[]): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const capped = entries.slice(0, COBROS_TODAY_TRAY_MAX_IDS);
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify(capped),
    );
  } catch {
    // Quota or private mode: in-memory state still covers this visit.
  }
}

export function appendCobrosTodayEntry(
  current: readonly CobrosTodayEntry[],
  entry: CobrosTodayEntry,
): CobrosTodayEntry[] {
  const withoutDup = current.filter((item) => item.paymentId !== entry.paymentId);
  const next = [entry, ...withoutDup].slice(0, COBROS_TODAY_TRAY_MAX_IDS);
  writeCobrosTodayTray(next);
  return next;
}

export function removeCobrosTodayEntry(
  current: readonly CobrosTodayEntry[],
  paymentId: string,
): CobrosTodayEntry[] {
  const next = current.filter((item) => item.paymentId !== paymentId);
  writeCobrosTodayTray(next);
  return next;
}

export function clearCobrosTodayTray(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(COBROS_TODAY_TRAY_STORAGE_KEY);
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
  } catch {
    // Private mode: ignore; caller still clears React state.
  }
}

/** @deprecated Prefer readCobrosTodayTray. */
export function readCobrosFollowThrough(): CobrosTodayEntry | null {
  const tray = readCobrosTodayTray();
  return tray[0] ?? null;
}

/** @deprecated Prefer appendCobrosTodayEntry. */
export function writeCobrosFollowThrough(value: CobrosTodayEntry): void {
  appendCobrosTodayEntry(readCobrosTodayTray(), value);
}

/** @deprecated Prefer clearCobrosTodayTray. */
export function clearCobrosFollowThrough(): void {
  clearCobrosTodayTray();
}

/** Grace before treating “absent from exceptions” as resolved (legacy F2). */
export const COBROS_FOLLOW_THROUGH_ABSENCE_GRACE_MS = 3_000;

/**
 * @deprecated Tray lifecycle is driven by live `rep-status` poll; kept for tests.
 */
export function shouldClearCobrosFollowThrough(
  followThrough: CobrosTodayEntry,
  live: {
    readonly exceptionsFetched: boolean;
    readonly exceptionPaymentIds: ReadonlySet<string> | readonly string[];
    readonly exceptionsMayBeIncomplete?: boolean;
    readonly previouslySeenInExceptions: boolean;
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
