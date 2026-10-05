/**
 * ADR-0096 addendum — helpers puros del cobro operativo (ledger).
 */

import type {
  OperationalCashCollectionStatus,
  OperationalCashSummary,
} from "./entities";

const MXN_EPS = 0.01;

export type OperationalCashProjectionInput = {
  operationalCash?: OperationalCashSummary | null;
  operationalCashCollectedAt?: Date | null;
  operationalCashAmount?: number | null;
  baseRate?: number | null;
};

/**
 * Lock de intent: hay cobro activo (status ≠ pending) o proyección con
 * `collected_at` / monto acumulado.
 */
export function hasOperationalCashCollected(
  trip: OperationalCashProjectionInput,
): boolean {
  const status = trip.operationalCash?.status;
  if (status === "partial" || status === "collected") return true;
  if (trip.operationalCashCollectedAt != null) return true;
  const amount = trip.operationalCashAmount;
  return amount != null && amount > 0;
}

export function classifyOperationalCashCollection(
  collectedTotal: number,
  baseRate: number,
): OperationalCashCollectionStatus {
  const collected = Number.isFinite(collectedTotal) ? collectedTotal : 0;
  const rate = Number.isFinite(baseRate) ? baseRate : 0;
  if (collected <= MXN_EPS) return "pending";
  if (collected + MXN_EPS >= rate) return "collected";
  return "partial";
}

/**
 * Preferir resumen API; si falta, derivar de proyección + tarifa.
 */
export function resolveOperationalCashSummary(
  trip: OperationalCashProjectionInput,
  fallbackBaseRate?: number | null,
): OperationalCashSummary {
  if (trip.operationalCash) return trip.operationalCash;

  const baseRate =
    fallbackBaseRate ?? trip.baseRate ?? trip.operationalCash?.baseRate ?? 0;
  const collectedTotal =
    trip.operationalCashAmount == null ? 0 : Number(trip.operationalCashAmount);
  const pendingAmount = Math.max(0, baseRate - collectedTotal);
  return {
    status: classifyOperationalCashCollection(collectedTotal, baseRate),
    collectedTotal,
    pendingAmount,
    baseRate,
    receiptCount: collectedTotal > MXN_EPS ? 1 : 0,
  };
}

export function canRegisterOperationalCashAbono(
  summary: Pick<OperationalCashSummary, "status" | "pendingAmount">,
): boolean {
  return summary.status !== "collected" && summary.pendingAmount > MXN_EPS;
}
