import { formatMonthAbbr, parseMonthPeriod } from "@shared/utils/monthPeriod";
import type { FinancialTrendData } from "../../domain/types";

export type DeltaDirection = "up" | "down" | "flat";

/**
 * Month-over-month % change for scorecard enrichment.
 * - `percent` when `previous > 0` (formula: ((current - previous) / previous) * 100)
 * - `unavailable` when previous ≤ 0 (incl. 0→positive): no invented %
 */
export type PercentDelta =
  | { kind: "percent"; direction: DeltaDirection; percent: number }
  | { kind: "unavailable" };

const BAR_MAX_POINTS = 6;

const MONTH_TITLE_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export function formatMonthTitle(month: number): string {
  return MONTH_TITLE_ES[month - 1] ?? "";
}

/** `2026-11` → «Noviembre». */
export function formatPeriodMonthTitle(period: string): string {
  const parsed = parseMonthPeriod(period);
  if (!parsed) return period;
  return formatMonthTitle(parsed.month);
}

export function computePercentDelta(
  current: number,
  previous: number,
): PercentDelta {
  if (!(previous > 0)) {
    return { kind: "unavailable" };
  }

  const raw = ((current - previous) / previous) * 100;
  const percent = Math.round(raw * 10) / 10;
  if (percent > 0) {
    return { kind: "percent", direction: "up", percent };
  }
  if (percent < 0) {
    return { kind: "percent", direction: "down", percent };
  }
  return { kind: "percent", direction: "flat", percent: 0 };
}

/** Signed label for the delta badge (`+8.2%`, `−1.0%`, `0%`). */
export function formatPercentDeltaLabel(percent: number): string {
  if (percent === 0) return "0%";
  const rounded = Math.round(percent * 10) / 10;
  const abs = Math.abs(rounded);
  const body = Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
  return `${rounded > 0 ? "+" : "−"}${body}%`;
}

function marginAt(trend: FinancialTrendData, index: number): number {
  return (trend.actual_revenue[index] ?? 0) - (trend.actual_cost[index] ?? 0);
}

export type MarginBarPoint = {
  period: string;
  monthAbbr: string;
  value: number;
  isCurrent: boolean;
  /** Mes de referencia (anterior al curso) — tono medio. */
  isReference: boolean;
};

/**
 * Últimas 2–6 barras de margen (ingreso − costo).
 * `undefined` si hay &lt;2 periodos (sin gráfica inventada).
 */
export function buildMarginBarSeries(
  trend: FinancialTrendData | undefined,
  maxPoints: number = BAR_MAX_POINTS,
): MarginBarPoint[] | undefined {
  if (!trend || trend.periods.length < 2) return undefined;

  const count = Math.max(2, Math.min(maxPoints, BAR_MAX_POINTS, trend.periods.length));
  const start = trend.periods.length - count;
  const currentPeriod =
    trend.currentPeriod ?? trend.periods[trend.periods.length - 1];
  const refPeriod =
    trend.periods.length >= 2
      ? trend.periods[trend.periods.length - 2]
      : undefined;

  return trend.periods.slice(start).map((period, offset) => {
    const index = start + offset;
    const parsed = parseMonthPeriod(period);
    return {
      period,
      monthAbbr: parsed ? formatMonthAbbr(parsed.month) : period,
      value: marginAt(trend, index),
      isCurrent: period === currentPeriod,
      isReference: period === refPeriod && period !== currentPeriod,
    };
  });
}

export type MarginComparison =
  | {
      kind: "period_delta";
      day: number;
      previousMonthAbbr: string;
      previousAmount: number;
      delta: PercentDelta;
    }
  | {
      kind: "closed_fallback";
      previousMonthTitle: string;
      previousAmount: number;
    }
  | { kind: "first_month" };

/**
 * Comparación de margen para el scorecard.
 * **Nunca** compara tramo vs mes completo: solo `periodToDate` permite %;
 * sin él → «{Mes ant} cerró en $X» (mes completo de la serie) sin %.
 */
export function resolveMarginComparison(
  trend: FinancialTrendData | undefined,
): MarginComparison | null {
  if (!trend || trend.periods.length === 0) return null;

  const ptd = trend.periodToDate;
  if (ptd) {
    if (ptd.previous == null) {
      return { kind: "first_month" };
    }
    const prevFrom = parseMonthPeriod(ptd.previous.from);
    return {
      kind: "period_delta",
      day: ptd.day,
      previousMonthAbbr: prevFrom
        ? formatMonthAbbr(prevFrom.month)
        : ptd.previous.from.slice(5, 7),
      previousAmount: ptd.previous.actual_margin,
      delta: computePercentDelta(
        ptd.current.actual_margin,
        ptd.previous.actual_margin,
      ),
    };
  }

  if (trend.periods.length < 2) {
    return { kind: "first_month" };
  }

  const prevIndex = trend.periods.length - 2;
  const prevPeriod = trend.periods[prevIndex]!;
  return {
    kind: "closed_fallback",
    previousMonthTitle: formatPeriodMonthTitle(prevPeriod),
    previousAmount: marginAt(trend, prevIndex),
  };
}

/** Margen del mes anterior completo en la serie (vacío / fallback copy). */
export function getPreviousClosedMargin(
  trend: FinancialTrendData | undefined,
): { monthTitle: string; amount: number } | null {
  if (!trend || trend.periods.length < 2) return null;
  const prevIndex = trend.periods.length - 2;
  return {
    monthTitle: formatPeriodMonthTitle(trend.periods[prevIndex]!),
    amount: marginAt(trend, prevIndex),
  };
}

/** % del ingreso: margen ÷ ingreso; sin % si ingreso ≤ 0. */
export function marginShareOfRevenue(
  margin: number,
  revenue: number,
): number | null {
  if (!(revenue > 0)) return null;
  return Math.round((margin / revenue) * 100);
}

/**
 * @deprecated F5 — no usar en scorecard (compara meses enteros).
 * Aislado para no reintroducir MoM tramo vs mes completo.
 */
export function getMarginMonthOverMonthDelta(
  trend: FinancialTrendData | undefined,
): PercentDelta | null {
  if (!trend || trend.periods.length < 2) return null;
  const last = trend.periods.length - 1;
  return computePercentDelta(marginAt(trend, last), marginAt(trend, last - 1));
}

/**
 * @deprecated F5 — reemplazado por `buildMarginBarSeries`.
 */
export function buildMarginSparkSeries(
  trend: FinancialTrendData | undefined,
  maxPoints: number = BAR_MAX_POINTS,
): { value: number }[] | undefined {
  const bars = buildMarginBarSeries(trend, maxPoints);
  return bars?.map((b) => ({ value: b.value }));
}
