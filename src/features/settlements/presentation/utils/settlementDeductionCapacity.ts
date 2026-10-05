import { isApiError } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  SETTLEMENT_DEDUCTIONS_EXCEED_GROSS,
  type DeductionCapacity,
} from "../../domain/settlementTotals";
import { settlementsCopy } from "../copy/settlementsCopy";

const capCopy = settlementsCopy.settlementFlow.deductionsCap;

/** Bloque del formulario donde se corrige el excedente. */
export type DeductionsExceedTarget = "advances" | "manual_items";

export interface DeductionsExceedGrossError {
  target: DeductionsExceedTarget;
  /** Texto del API (incluye «Devuelve la liquidación a borrador…» fuera de borrador). */
  message: string;
  maxAdvanceDeductible: number | null;
}

function readNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return value === undefined || value === null || !Number.isFinite(parsed) ? null : parsed;
}

/** 422 `SETTLEMENT_DEDUCTIONS_EXCEED_GROSS` → bloque según `details.path`; `null` si es otro error. */
export function parseDeductionsExceedGrossError(error: unknown): DeductionsExceedGrossError | null {
  if (!isApiError(error) || error.code !== SETTLEMENT_DEDUCTIONS_EXCEED_GROSS) return null;
  const details = (error.details ?? {}) as Record<string, unknown>;
  const path = Array.isArray(details.path) ? details.path : [];
  const target: DeductionsExceedTarget =
    path[0] === "custom_items" ||
    (path.length === 0 && details.excess_source === "manual_deductions")
      ? "manual_items"
      : "advances";
  return {
    target,
    message: error.message,
    maxAdvanceDeductible: readNumber(details.max_advance_deductible),
  };
}

export function isDeductionsExceedGrossError(error: unknown): boolean {
  return parseDeductionsExceedGrossError(error) !== null;
}

export interface DeductionCapacityErrors {
  advances?: string;
  manualItems?: string;
}

/**
 * Mensajes inline del excedente local. Si los anticipos no se pueden editar,
 * el excedente solo se corrige con las partidas manuales.
 */
export function deductionCapacityErrors(
  capacity: DeductionCapacity,
  options: { advancesEditable: boolean } = { advancesEditable: true },
): DeductionCapacityErrors {
  if (capacity.excessSource === null) return {};
  if (capacity.excessSource === "advances" && options.advancesEditable) {
    return { advances: capCopy.advancesExceed(formatMxCurrency(capacity.maxAdvanceDeductible)) };
  }
  return { manualItems: capCopy.manualExceed };
}

/** Mensaje inline del 422: en borrador el copy local con el máximo; fuera de borrador, el del API. */
export function deductionsExceedErrorsFromServer(
  parsed: DeductionsExceedGrossError,
  options: { useServerMessage: boolean },
): DeductionCapacityErrors {
  if (options.useServerMessage) {
    return parsed.target === "advances"
      ? { advances: parsed.message }
      : { manualItems: parsed.message };
  }
  if (parsed.target === "manual_items") return { manualItems: capCopy.manualExceed };
  return {
    advances:
      parsed.maxAdvanceDeductible === null
        ? parsed.message
        : capCopy.advancesExceed(formatMxCurrency(parsed.maxAdvanceDeductible)),
  };
}

export interface AdvanceForAllocation {
  advanceId: string;
  /** Saldo libre a descontar (saldo − reservado). */
  available: number;
  disbursedAt: string | null;
}

const toCents = (value: number): number => Math.round((Number(value) || 0) * 100);

/**
 * Reparte el máximo descontable entre anticipos en orden FIFO por entrega
 * (sin fecha al final; estable por orden de entrada), cada uno topado a su
 * saldo libre. Los que no alcanzan nada no aparecen en el resultado.
 */
export function allocateAdvancesFifo(
  advances: readonly AdvanceForAllocation[],
  maxDeductible: number,
): Record<string, number> {
  const order = advances
    .map((advance, index) => ({ advance, index }))
    .sort((left, right) => {
      const a = left.advance.disbursedAt;
      const b = right.advance.disbursedAt;
      if (a && b && a !== b) return a < b ? -1 : 1;
      if (a && !b) return -1;
      if (!a && b) return 1;
      return left.index - right.index;
    });
  let remaining = Math.max(0, toCents(maxDeductible));
  const allocation: Record<string, number> = {};
  for (const { advance } of order) {
    const take = Math.min(Math.max(0, toCents(advance.available)), remaining);
    if (take <= 0) continue;
    allocation[advance.advanceId] = take / 100;
    remaining -= take;
  }
  return allocation;
}

/** Saldo descontable: el disponible (descuenta reservas) o el saldo pendiente. */
export function deductableAdvanceBalance(adv: {
  balanceRemaining: number;
  availableBalance?: number;
}): number {
  if (typeof adv.availableBalance === "number") {
    return Math.max(0, adv.availableBalance);
  }
  return adv.balanceRemaining;
}

/** Lo que cabe para un anticipo nuevo sin mover los ya capturados. */
export function remainingAdvanceRoom(params: {
  available: number;
  maxDeductible: number;
  otherAdvancesTotal: number;
}): number {
  const room = Math.max(0, toCents(params.maxDeductible) - toCents(params.otherAdvancesTotal));
  return Math.min(Math.max(0, toCents(params.available)), room) / 100;
}
