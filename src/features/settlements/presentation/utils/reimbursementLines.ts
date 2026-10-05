import { formatDate } from "@shared/utils/dateUtils";
import type {
  DriverSettlement,
  SettlementItem,
  SettlementKind,
  TripSettledInRef,
} from "../../domain/entities";
import { EXPENSE_CATEGORY_LABELS } from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.reimbursements;

/** Concepto visible de un gasto: categoría y, si hay, la descripción capturada. */
export function reimbursementConcept(category: string | null | undefined, description: string): string {
  const label = category ? (EXPENSE_CATEGORY_LABELS[category.toLowerCase()] ?? category) : "";
  const detail = description.trim();
  if (label && detail) return `${label} · ${detail}`;
  return label || detail || "—";
}

/** Ruta a la pestaña Costos del viaje del gasto. */
export function tripCostsPath(tripId: string): string {
  return `/trips/${tripId}?tab=costs`;
}

/** ADR-0085 E11 punto 9 / D11: viaje del reembolso y el pago que trae su comisión. */
export function reimbursementTripLine(
  tripCode: string,
  tripSettledIn: TripSettledInRef | null,
): string {
  return tripSettledIn?.settlementNumber
    ? copy.tripLineSettledIn(tripCode, tripSettledIn.settlementNumber)
    : copy.tripLineNotSettled(tripCode);
}

/**
 * Línea D11 de una partida de reembolso. `null` si el viaje va en el mismo pago
 * (partidas 7(a): el API no guarda `trip_settled_in`).
 */
export function reimbursementItemTripLine(item: SettlementItem): string | null {
  if (item.itemType !== "approved_expense_reimbursement") return null;
  const details = item.calculationDetails;
  if (!details || !("tripSettledIn" in details)) return null;
  return reimbursementTripLine(item.tripCode ?? "—", details.tripSettledIn ?? null);
}

/** D12: un pago de reembolsos muestra su fecha de alta en lugar del período. */
export function settlementPeriodLabel(settlement: {
  settlementKind?: SettlementKind | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}): string {
  if (settlement.settlementKind === "reimbursement_only") {
    return formatDate(settlement.createdAt);
  }
  return `${formatDate(settlement.periodStart)} – ${formatDate(settlement.periodEnd)}`;
}

const STATUSES_WITH_LATE_ALERT = new Set(["draft", "pending_approval", "approved"]);

/** E11 punto 10: el aviso de tardíos solo aplica a pagos vivos sin registrar. */
export function shouldShowLateReimbursementsAlert(settlement: DriverSettlement): boolean {
  return (
    STATUSES_WITH_LATE_ALERT.has(settlement.status) &&
    (settlement.lateReimbursements?.count ?? 0) > 0
  );
}

/** E11 punto 8: gasto asignado a este operador a mano tras un cambio de conductor. */
export function isManualPayeeReimbursement(item: SettlementItem): boolean {
  return (
    item.itemType === "approved_expense_reimbursement" &&
    item.calculationDetails?.payeeResolution === "manual"
  );
}
