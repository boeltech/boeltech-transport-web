import { getInProgressPeriod } from "@features/finance/application";
import type {
  IncomeByMonth,
  MonthlyPerformance,
  PeriodFinancials,
} from "@features/finance/domain";

/**
 * Mes en curso del Pulse: último periodo de `performance/monthly`
 * (`getInProgressPeriod`), no el reloj del navegador.
 */
export function resolveFinancePulseMonth(
  data: MonthlyPerformance | undefined,
): PeriodFinancials | null {
  if (!data) return null;
  const periodKey = getInProgressPeriod(data);
  if (!periodKey) return data.current.at(-1) ?? null;
  return (
    data.current.find((row) => row.period === periodKey) ??
    data.current.at(-1) ??
    null
  );
}

/** Meses a pedir al API para el Pulse (solo hace falta el mes en curso). */
export const FINANCE_PULSE_PERFORMANCE_MONTHS = 1;

/** Serie cobrado/mes para sparkline del KPI Cobrado (income/by-month). */
export const FINANCE_COLLECTED_TREND_MONTHS = 6;

/**
 * Puntos para Sparkline: ≥2 valores; si no, `undefined` (no half-wired).
 */
export function toCollectedTrendData(
  income: IncomeByMonth | undefined,
): { value: number }[] | undefined {
  const collected = income?.collected;
  if (!collected || collected.length < 2) return undefined;
  return collected.map((value) => ({ value }));
}

/**
 * Margen del Pulse = `operational_margin` (TD4).
 * Ingreso = `actual_revenue` (subtotal/tarifa; no depende del flag).
 * No usa `actual_margin` / `actual_cost`.
 */
export function pulseOperationalTotals(row: PeriodFinancials | null | undefined): {
  revenue: number;
  operationalMargin: number;
  hasOperationalMargin: boolean;
} {
  if (!row) {
    return { revenue: 0, operationalMargin: 0, hasOperationalMargin: false };
  }
  return {
    revenue: row.actualRevenue,
    operationalMargin: row.operationalMargin ?? 0,
    hasOperationalMargin: row.operationalMargin != null,
  };
}
