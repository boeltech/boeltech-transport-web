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

const SPARK_MAX_POINTS = 6;

export function computePercentDelta(
  current: number,
  previous: number,
): PercentDelta {
  if (!(previous > 0)) {
    return { kind: "unavailable" };
  }

  const raw = ((current - previous) / previous) * 100;
  // One decimal — avoids float noise and matches the badge label.
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

function marginAt(
  trend: FinancialTrendData,
  index: number,
): number {
  return (trend.actual_revenue[index] ?? 0) - (trend.actual_cost[index] ?? 0);
}

/**
 * Last 2–6 margin points from financial-trend (revenue − cost).
 * Undefined when there are fewer than 2 periods (no sparkline to invent).
 */
export function buildMarginSparkSeries(
  trend: FinancialTrendData | undefined,
  maxPoints: number = SPARK_MAX_POINTS,
): { value: number }[] | undefined {
  if (!trend || trend.periods.length < 2) return undefined;

  const margins = trend.periods.map((_, index) => marginAt(trend, index));
  const slice = margins.slice(-Math.max(2, Math.min(maxPoints, SPARK_MAX_POINTS)));
  return slice.map((value) => ({ value }));
}

/**
 * MoM delta for the last two periods of the margin series.
 * Null when the trend cannot support a comparison (≥2 periods required).
 */
export function getMarginMonthOverMonthDelta(
  trend: FinancialTrendData | undefined,
): PercentDelta | null {
  if (!trend || trend.periods.length < 2) return null;

  const last = trend.periods.length - 1;
  return computePercentDelta(marginAt(trend, last), marginAt(trend, last - 1));
}
