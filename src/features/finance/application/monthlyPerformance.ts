/**
 * Cálculos puros de la vista Mes a mes (Finanzas › Análisis):
 * totales del rango, margen % y variación contra el mismo mes del año anterior.
 * «N meses» son N meses completos; el mes en curso se muestra aparte y nunca se suma
 * ni se compara.
 */

import type {
  MonthlyPerformance,
  PeriodFinancials,
} from "@features/finance/domain";
import { shiftMonthPeriod } from "@shared/utils/monthPeriod";

export const MONTHLY_PERFORMANCE_MONTH_OPTIONS = [6, 12] as const;

export type MonthlyPerformanceMonths =
  (typeof MONTHLY_PERFORMANCE_MONTH_OPTIONS)[number];

export const DEFAULT_MONTHLY_PERFORMANCE_MONTHS: MonthlyPerformanceMonths = 12;

export const YEAR_OVER_YEAR_OFFSET_MONTHS = 12;

/** Meses a pedir al API: los N completos más el mes en curso (el API admite hasta 24). */
export function monthlyPerformanceRequestMonths(
  months: MonthlyPerformanceMonths,
): number {
  return months + 1;
}

/**
 * - `none`: ambos periodos en cero (no hay nada que comparar).
 * - `new`: el año anterior está en cero y el actual no (% no definido).
 * - `change`: variación porcentual sobre el valor absoluto del año anterior.
 */
export interface Variation {
  kind: "none" | "new" | "change";
  delta: number;
  pct: number | null;
}

export type VariationPolarity = "higher-is-better" | "lower-is-better";

export type VariationSentiment = "positive" | "negative" | "neutral";

export interface PerformanceTotals {
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number | null;
  tripCount: number;
}

/** Desplaza un periodo `YYYY-MM` `deltaMonths` meses (negativo = hacia atrás). */
export function shiftPeriod(period: string, deltaMonths: number): string {
  return shiftMonthPeriod(period, deltaMonths);
}

export function computeVariation(current: number, previous: number): Variation {
  const delta = current - previous;
  if (previous === 0) {
    return current === 0
      ? { kind: "none", delta: 0, pct: null }
      : { kind: "new", delta, pct: null };
  }
  return { kind: "change", delta, pct: (delta / Math.abs(previous)) * 100 };
}

export function variationSentiment(
  variation: Variation,
  polarity: VariationPolarity,
): VariationSentiment {
  if (variation.kind === "none" || variation.delta === 0) return "neutral";
  const wentUp = variation.delta > 0;
  const upIsGood = polarity === "higher-is-better";
  return wentUp === upIsGood ? "positive" : "negative";
}

/** Margen como % del ingreso; `null` si no hay ingreso (evita Infinity/NaN). */
export function computeMarginPct(margin: number, revenue: number): number | null {
  if (revenue === 0) return null;
  return (margin / revenue) * 100;
}

export function hasPeriodActivity(row: PeriodFinancials): boolean {
  return row.tripCount > 0 || row.actualRevenue !== 0 || row.actualCost !== 0;
}

export function hasAnyPeriodActivity(rows: readonly PeriodFinancials[]): boolean {
  return rows.some(hasPeriodActivity);
}

export function summarizePeriods(
  rows: readonly PeriodFinancials[],
): PerformanceTotals {
  const totals = rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.actualRevenue,
      cost: acc.cost + row.actualCost,
      margin: acc.margin + row.actualMargin,
      tripCount: acc.tripCount + row.tripCount,
    }),
    { revenue: 0, cost: 0, margin: 0, tripCount: 0 },
  );
  return { ...totals, marginPct: computeMarginPct(totals.margin, totals.revenue) };
}

/** Último periodo de la respuesta = mes en curso (no el reloj del navegador). */
export function getInProgressPeriod(data: MonthlyPerformance): string | null {
  return data.periods.at(-1) ?? data.current.at(-1)?.period ?? null;
}

function emptyPeriod(period: string): PeriodFinancials {
  return {
    period,
    actualRevenue: 0,
    actualCost: 0,
    actualMargin: 0,
    tripCount: 0,
  };
}

export interface AlignedPerformanceMonth {
  period: string;
  current: PeriodFinancials;
  previous: PeriodFinancials;
  isInProgress: boolean;
}

/** Une `current[i]` con `previous[i]` y rellena huecos con ceros. */
export function alignPerformanceMonths(
  data: MonthlyPerformance,
): AlignedPerformanceMonth[] {
  const periods = data.periods.length
    ? data.periods
    : data.current.map((row) => row.period);
  const inProgress = getInProgressPeriod(data);
  return periods.map((period, index) => {
    const current = data.current[index] ?? emptyPeriod(period);
    const previous =
      data.previous[index] ??
      emptyPeriod(shiftPeriod(period, -YEAR_OVER_YEAR_OFFSET_MONTHS));
    return {
      period,
      current,
      previous,
      isInProgress: period === inProgress,
    };
  });
}

export interface PerformanceWindowSplit {
  completed: AlignedPerformanceMonth[];
  inProgress: AlignedPerformanceMonth | null;
}

export function splitCompletedMonths(
  months: readonly AlignedPerformanceMonth[],
): PerformanceWindowSplit {
  return {
    completed: months.filter((month) => !month.isInProgress),
    inProgress: months.find((month) => month.isInProgress) ?? null,
  };
}

export interface PerformanceWindowSummary {
  completed: AlignedPerformanceMonth[];
  inProgress: AlignedPerformanceMonth | null;
  /** Totales de los KPI: meses completos o, si ninguno tiene actividad, el mes en curso. */
  current: PerformanceTotals;
  /** Mismos meses completos un año antes. */
  previous: PerformanceTotals;
  /** Hay actividad en algún mes de la ventana, incluido el mes en curso. */
  hasCurrent: boolean;
  /** Hay actividad del año anterior en los meses completos. */
  hasPrevious: boolean;
  /** Solo el mes en curso tiene actividad: no hay nada completo que sumar ni comparar. */
  inProgressOnly: boolean;
  canCompare: boolean;
}

export function summarizePerformanceWindow(
  months: readonly AlignedPerformanceMonth[],
): PerformanceWindowSummary {
  const { completed, inProgress } = splitCompletedMonths(months);
  const completedCurrent = completed.map((month) => month.current);
  const completedPrevious = completed.map((month) => month.previous);
  const hasCompletedActivity = hasAnyPeriodActivity(completedCurrent);
  const inProgressHasActivity = inProgress
    ? hasPeriodActivity(inProgress.current)
    : false;
  const inProgressOnly = !hasCompletedActivity && inProgressHasActivity;
  const hasPrevious = hasAnyPeriodActivity(completedPrevious);

  return {
    completed,
    inProgress,
    current: summarizePeriods(
      inProgressOnly && inProgress ? [inProgress.current] : completedCurrent,
    ),
    previous: summarizePeriods(completedPrevious),
    hasCurrent: hasCompletedActivity || inProgressHasActivity,
    hasPrevious,
    inProgressOnly,
    canCompare: hasPrevious && !inProgressOnly,
  };
}
