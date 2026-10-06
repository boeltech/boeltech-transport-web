import {
  computeMarginPct,
  computeVariation,
  type AlignedPerformanceMonth,
  type Variation,
} from "@features/finance/application";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  formatMonthPeriodShort,
  parseMonthPeriod,
} from "@shared/utils/monthPeriod";
import { financeCopy } from "../copy";

const copy = financeCopy.performance;

/** `2026-01` → `ene 2026`. */
export function formatPerformanceMonth(period: string): string {
  return formatMonthPeriodShort(period);
}

/** `2026-01` → `2026`. */
export function formatPerformanceYear(period: string): string {
  return parseMonthPeriod(period)?.year.toString() ?? period;
}

export function formatPerformanceMonthWithStatus(
  period: string,
  isInProgress: boolean,
): string {
  const label = formatPerformanceMonth(period);
  return isInProgress ? `${label} ${copy.chart.inProgressSuffix}` : label;
}

const pctFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return copy.variation.none;
  return `${pctFormatter.format(value)}%`;
}

export function formatVariationPct(variation: Variation): string {
  if (variation.kind === "none") return copy.variation.none;
  if (variation.kind === "new" || variation.pct == null) return copy.variation.new;
  const sign = variation.pct > 0 ? "+" : variation.pct < 0 ? "−" : "";
  return `${sign}${pctFormatter.format(Math.abs(variation.pct))}%`;
}

export function formatSignedCurrency(amount: number): string {
  if (amount === 0) return formatMxCurrency(0);
  const sign = amount > 0 ? "+" : "−";
  return `${sign}${formatMxCurrency(Math.abs(amount))}`;
}

/** `+$200.00 (+25.0%)`; sin paréntesis cuando no hay % definido. */
export function formatVariationDetail(variation: Variation): string {
  const amount = formatSignedCurrency(variation.delta);
  if (variation.kind === "none") return amount;
  return `${amount} (${formatVariationPct(variation)})`;
}

export interface PerformanceChartRow {
  [key: string]: string | number | null;
  period: string;
  revenue: number;
  cost: number;
  marginPct: number | null;
  previousRevenue: number;
  previousCost: number;
  previousMarginPct: number | null;
}

/** Filas de ambas gráficas; el eje X va por `period` (`YYYY-MM`). */
export function buildPerformanceChartRows(
  months: readonly AlignedPerformanceMonth[],
): PerformanceChartRow[] {
  return months.map((month) => {
    return {
      period: month.period,
      revenue: month.current.actualRevenue,
      cost: month.current.actualCost,
      marginPct: computeMarginPct(
        month.current.actualMargin,
        month.current.actualRevenue,
      ),
      previousRevenue: month.previous.actualRevenue,
      previousCost: month.previous.actualCost,
      previousMarginPct: computeMarginPct(
        month.previous.actualMargin,
        month.previous.actualRevenue,
      ),
    };
  });
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function csvPct(value: number | null): number | string {
  return value == null ? "" : roundTo2(value);
}

function csvVariation(variation: Variation): number | string {
  if (variation.kind === "none") return "";
  if (variation.kind === "new" || variation.pct == null) return copy.csv.newValue;
  return roundTo2(variation.pct);
}

export interface CsvTable {
  headers: string[];
  rows: Array<Array<string | number>>;
}

export function buildMonthlyPerformanceCsv(
  months: readonly AlignedPerformanceMonth[],
  options: { compare: boolean },
): CsvTable {
  const c = copy.csv;
  const baseHeaders = [c.month, c.revenue, c.cost, c.margin, c.marginPct, c.trips];
  const headers = options.compare
    ? [
        ...baseHeaders,
        ...baseHeaders.map((header) => `${header}${c.previousSuffix}`),
        c.revenueVariationPct,
        c.costVariationPct,
        c.marginVariationPct,
      ]
    : baseHeaders;

  const rows = months.map((month) => {
    const { current, previous } = month;
    const base: Array<string | number> = [
      current.period,
      current.actualRevenue,
      current.actualCost,
      current.actualMargin,
      csvPct(computeMarginPct(current.actualMargin, current.actualRevenue)),
      current.tripCount,
    ];
    if (!options.compare) return base;
    return [
      ...base,
      previous.period,
      previous.actualRevenue,
      previous.actualCost,
      previous.actualMargin,
      csvPct(computeMarginPct(previous.actualMargin, previous.actualRevenue)),
      previous.tripCount,
      csvVariation(computeVariation(current.actualRevenue, previous.actualRevenue)),
      csvVariation(computeVariation(current.actualCost, previous.actualCost)),
      csvVariation(computeVariation(current.actualMargin, previous.actualMargin)),
    ];
  });

  return { headers, rows };
}
