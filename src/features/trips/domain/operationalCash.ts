/**
 * ADR-0096 addendum — helpers puros del cobro operativo (ledger).
 * La clasificación vive en `@boeltech/cfdi-domain` (R2). Aquí solo se
 * proyecta el resumen y el permiso de abono.
 */

import {
  classifyOperationalCashCollection,
  operationalCashPendingAmount,
} from "@boeltech/cfdi-domain";

import type { OperationalCashSummary } from "./entities";

const MXN_EPS = 0.01;

export { classifyOperationalCashCollection };

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

/**
 * Preferir resumen API; si falta, derivar de proyección + tarifa
 * con el clasificador del paquete.
 */
export function resolveOperationalCashSummary(
  trip: OperationalCashProjectionInput,
  fallbackBaseRate?: number | null,
): OperationalCashSummary {
  if (trip.operationalCash) return trip.operationalCash;

  const baseRate = fallbackBaseRate ?? trip.baseRate ?? 0;
  const collectedTotal =
    trip.operationalCashAmount == null ? 0 : Number(trip.operationalCashAmount);
  const status = classifyOperationalCashCollection(collectedTotal, baseRate);
  return {
    status,
    collectedTotal,
    pendingAmount: operationalCashPendingAmount(collectedTotal, baseRate),
    baseRate,
    receiptCount: status === "pending" ? 0 : 1,
  };
}

export function canRegisterOperationalCashAbono(
  summary: Pick<OperationalCashSummary, "status" | "pendingAmount">,
): boolean {
  return summary.status !== "collected" && summary.pendingAmount > MXN_EPS;
}
