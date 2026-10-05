import { isApiError } from "@shared/api/interceptors/error-handler";
import type { SettlementPeriodOverlapStatus } from "../../domain/entities";

export interface TripConsumptionConflict {
  readonly tripId: string;
  readonly tripCode: string;
  readonly settlementId: string;
  readonly settlementNumber: string;
  readonly status: SettlementPeriodOverlapStatus;
}

export interface PeriodPartialOverlapConflict {
  readonly settlementId: string;
  readonly settlementNumber: string;
  readonly status: SettlementPeriodOverlapStatus;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly suggestedPeriodStart: string;
}

function detailsOf(error: unknown, code: string): Record<string, unknown> | null {
  if (!isApiError(error) || error.code !== code) return null;
  return (error.details ?? {}) as Record<string, unknown>;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** 409 `TRIP_IN_ACTIVE_SETTLEMENT`: viajes pedidos que ya consume otro pago vivo del operador. */
export function parseTripInActiveSettlementError(
  error: unknown,
): readonly TripConsumptionConflict[] | null {
  const details = detailsOf(error, "TRIP_IN_ACTIVE_SETTLEMENT");
  if (!details) return null;
  const rows = Array.isArray(details.conflicts) ? details.conflicts : [];
  return rows.map((row) => {
    const record = (row ?? {}) as Record<string, unknown>;
    return {
      tripId: text(record.trip_id),
      tripCode: text(record.trip_code),
      settlementId: text(record.settlement_id),
      settlementNumber: text(record.settlement_number),
      status: text(record.status) as SettlementPeriodOverlapStatus,
    };
  });
}

/** 409 `PERIOD_PARTIAL_OVERLAP`: el bloque de período se cruza con otro pago vivo. */
export function parsePeriodPartialOverlapError(
  error: unknown,
): PeriodPartialOverlapConflict | null {
  const details = detailsOf(error, "PERIOD_PARTIAL_OVERLAP");
  if (!details) return null;
  return {
    settlementId: text(details.settlement_id),
    settlementNumber: text(details.settlement_number),
    status: text(details.status) as SettlementPeriodOverlapStatus,
    periodStart: text(details.period_start),
    periodEnd: text(details.period_end),
    suggestedPeriodStart: text(details.suggested_period_start),
  };
}

export interface ExpenseConsumptionConflict {
  readonly tripExpenseId: string;
  readonly tripCode: string;
  readonly settlementId: string;
  readonly settlementNumber: string;
  readonly status: SettlementPeriodOverlapStatus;
}

/** ADR-0085 E11-F3: errores del alta ligados a reembolsos (siempre se recalcula). */
export type ReimbursementCreateError =
  | { readonly kind: "requires_expenses" }
  | { readonly kind: "payee_not_trip_driver"; readonly tripExpenseId: string }
  | { readonly kind: "not_eligible"; readonly tripExpenseId: string }
  | { readonly kind: "expense_in_active_settlement"; readonly conflicts: readonly ExpenseConsumptionConflict[] };

export function parseReimbursementCreateError(error: unknown): ReimbursementCreateError | null {
  if (!isApiError(error)) return null;
  const details = (error.details ?? {}) as Record<string, unknown>;
  switch (error.code) {
    case "REIMBURSEMENT_ONLY_REQUIRES_EXPENSES":
      return { kind: "requires_expenses" };
    case "REIMBURSEMENT_PAYEE_NOT_TRIP_DRIVER":
      return { kind: "payee_not_trip_driver", tripExpenseId: text(details.trip_expense_id) };
    case "REIMBURSEMENT_NOT_ELIGIBLE":
      return { kind: "not_eligible", tripExpenseId: text(details.trip_expense_id) };
    case "EXPENSE_IN_ACTIVE_SETTLEMENT": {
      const rows = Array.isArray(details.conflicts) ? details.conflicts : [];
      return {
        kind: "expense_in_active_settlement",
        conflicts: rows.map((row) => {
          const record = (row ?? {}) as Record<string, unknown>;
          return {
            tripExpenseId: text(record.trip_expense_id),
            tripCode: text(record.trip_code),
            settlementId: text(record.settlement_id),
            settlementNumber: text(record.settlement_number),
            status: text(record.status) as SettlementPeriodOverlapStatus,
          };
        }),
      };
    }
    default:
      return null;
  }
}

/** 409 `EXPENSE_ALREADY_IN_PAID_SETTLEMENT` al registrar el pago: folio que ya pagó el gasto. */
export function parseExpenseAlreadyPaidError(
  error: unknown,
): { readonly settlementNumber: string | null } | null {
  const details = detailsOf(error, "EXPENSE_ALREADY_IN_PAID_SETTLEMENT");
  if (!details) return null;
  const conflicts = Array.isArray(details.conflicts) ? details.conflicts : [];
  const first = (conflicts[0] ?? {}) as Record<string, unknown>;
  const folio = text(details.settlement_number) || text(first.settlement_number);
  return { settlementNumber: folio || null };
}

/** 422 `NO_RULE_TRIPS_ACK_REQUIRED`: códigos de viaje que faltan por confirmar en $0. */
export function parseNoRuleAckRequiredError(error: unknown): readonly string[] | null {
  const details = detailsOf(error, "NO_RULE_TRIPS_ACK_REQUIRED");
  if (!details) return null;
  return Array.isArray(details.trip_codes) ? details.trip_codes.map(text) : [];
}
