import { isApiError } from "@shared/api/interceptors/error-handler";
import type {
  AssignmentBlockingSettlement,
  AssignmentPeriodSettledError,
} from "../../domain/entities";
import {
  COMPENSATION_ERROR_CODES,
  type AssignmentBlockingSettlementStatus,
} from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";

const errorCopy = compensationCopy.templateActions.errors;

export function getCompensationErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) return error.code;
  return undefined;
}

/** `details.reason` del 409 `TEMPLATE_CONFIG_LOCKED` (llega sin convertir a camelCase). */
function getConfigLockedReason(error: unknown): string | undefined {
  if (!isApiError(error)) return undefined;
  const reason = error.details?.reason;
  return typeof reason === "string" ? reason : undefined;
}

export function isTemplateConfigLockedError(error: unknown): boolean {
  return getCompensationErrorCode(error) === COMPENSATION_ERROR_CODES.TEMPLATE_CONFIG_LOCKED;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function readBlockingSettlement(value: unknown): AssignmentBlockingSettlement | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const settlementId = readString(raw.settlement_id);
  const settlementNumber = readString(raw.settlement_number);
  const status = readString(raw.status);
  const periodStart = readString(raw.period_start);
  const periodEnd = readString(raw.period_end);
  if (!settlementId || !settlementNumber || !status || !periodStart || !periodEnd) return null;
  return {
    settlementId,
    settlementNumber,
    status: status as AssignmentBlockingSettlementStatus,
    periodStart,
    periodEnd,
  };
}

/**
 * 409 `ASSIGNMENT_PERIOD_SETTLED` (api#62) en lote, cierre, baja o eliminación de asignación.
 * `details` llega sin convertir a camelCase; `null` si el error es otro.
 */
export function readAssignmentPeriodSettledError(
  error: unknown,
): AssignmentPeriodSettledError | null {
  if (!isApiError(error)) return null;
  if (error.code !== COMPENSATION_ERROR_CODES.ASSIGNMENT_PERIOD_SETTLED) return null;

  const details = error.details ?? {};
  const settlements = Array.isArray(details.blocking_settlements)
    ? details.blocking_settlements
        .map(readBlockingSettlement)
        .filter((settlement): settlement is AssignmentBlockingSettlement => settlement !== null)
    : [];
  const total = details.blocking_settlements_total;

  return {
    message: readString(details.message) ?? error.message,
    existingAssignmentId: readString(details.existing_assignment_id),
    blockingSettlements: settlements,
    blockingSettlementsTotal:
      typeof total === "number" ? Math.max(total, settlements.length) : settlements.length,
    minEffectiveTo: readString(details.min_effective_to),
    suggestedEffectiveFrom: readString(details.suggested_effective_from),
  };
}

export function getCompensationLifecycleErrorMessage(
  error: unknown,
): string | undefined {
  const code = getCompensationErrorCode(error);
  if (!code) return undefined;

  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_CONFIG_LOCKED) {
    return getConfigLockedReason(error) === "superseded"
      ? errorCopy.TEMPLATE_CONFIG_LOCKED_SUPERSEDED
      : errorCopy.TEMPLATE_CONFIG_LOCKED;
  }
  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_NOT_ACTIVATABLE) {
    return errorCopy.TEMPLATE_NOT_ACTIVATABLE;
  }
  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_INVALID_STATUS_TRANSITION) {
    return errorCopy.TEMPLATE_INVALID_STATUS_TRANSITION;
  }
  return undefined;
}
