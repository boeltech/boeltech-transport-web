import {
  computeMarginPct,
  computeVariation,
  type AlignedPerformanceMonth,
  type PerformanceWindowSummary,
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
  /** `null` en el mes en curso: no se dibuja contra el año anterior. */
  previousRevenue: number | null;
  previousCost: number | null;
  previousMarginPct: number | null;
}

/**
 * Filas de ambas gráficas; el eje X va por `period` (`YYYY-MM`).
 * El mes en curso no lleva año anterior: sin barras claras y la línea punteada
 * de margen termina en el último mes completo.
 */
export function buildPerformanceChartRows(
  months: readonly AlignedPerformanceMonth[],
): PerformanceChartRow[] {
  return months.map((month) => {
    const withPrevious = !month.isInProgress;
    return {
      period: month.period,
      revenue: month.current.actualRevenue,
      cost: month.current.actualCost,
      marginPct: computeMarginPct(
        month.current.actualMargin,
        month.current.actualRevenue,
      ),
      previousRevenue: withPrevious ? month.previous.actualRevenue : null,
      previousCost: withPrevious ? month.previous.actualCost : null,
      previousMarginPct: withPrevious
        ? computeMarginPct(month.previous.actualMargin, month.previous.actualRevenue)
        : null,
    };
  });
}

/**
 * Rótulo sobre los KPI: «Totales de oct 2025 a sep 2026 · 12 meses completos.
 * oct 2026 va en curso…», o el modo «solo mes en curso».
 */
export function formatPerformancePeriodNote(
  summary: Pick<PerformanceWindowSummary, "completed" | "inProgress" | "inProgressOnly">,
): string {
  const { completed, inProgress, inProgressOnly } = summary;
  if (inProgressOnly && inProgress) {
    return copy.periodNote.inProgressOnly(formatPerformanceMonth(inProgress.period));
  }
  if (completed.length === 0) return "";
  const range = copy.rangeLabel(
    formatPerformanceMonth(completed[0]!.period),
    formatPerformanceMonth(completed.at(-1)!.period),
  );
  const completedNote = copy.periodNote.completed(range, completed.length);
  return inProgress
    ? `${completedNote}${copy.periodNote.inProgress(formatPerformanceMonth(inProgress.period))}`
    : completedNote;
}

/**
 * Nota bajo el rótulo de periodo cuando algún mes completo del summary es
 * provisional. Nunca en modo «solo mes en curso».
 */
export function formatPerformanceProvisionalKpiNote(
  summary: Pick<PerformanceWindowSummary, "completed" | "inProgressOnly">,
): string | null {
  if (summary.inProgressOnly) return null;
  const hasProvisionalCompleted = summary.completed.some(
    (month) => month.current.provisional,
  );
  return hasProvisionalCompleted ? copy.kpis.provisionalNote : null;
}

/** Hay meses cerrados (no en curso) con `provisional` del API. */
export function hasClosedProvisionalMonths(
  months: readonly AlignedPerformanceMonth[],
): boolean {
  return months.some((month) => !month.isInProgress && month.current.provisional);
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
  const amountHeaders = [
    c.revenue,
    c.cost,
    c.margin,
    c.marginPct,
    c.personnelCost,
    c.trips,
  ];
  const provisionalHeaders = [
    c.provisional,
    c.incompleteTrips,
    c.tripsWithPendingExpenses,
  ];
  const baseHeaders = [c.month, c.status, ...amountHeaders, ...provisionalHeaders];
  const headers = options.compare
    ? [
        ...baseHeaders,
        ...[c.month, ...amountHeaders].map((header) => `${header}${c.previousSuffix}`),
        c.revenueVariationPct,
        c.costVariationPct,
        c.marginVariationPct,
      ]
    : baseHeaders;

  const rows = months.map((month) => {
    const { current, previous } = month;
    const base: Array<string | number> = [
      current.period,
      month.isInProgress ? c.statusInProgress : c.statusCompleted,
      current.actualRevenue,
      current.actualCost,
      current.actualMargin,
      csvPct(computeMarginPct(current.actualMargin, current.actualRevenue)),
      current.periodPersonnelCost ?? 0,
      current.tripCount,
      current.provisional ? c.provisionalYes : c.provisionalNo,
      current.incompleteTripCount,
      current.tripsWithPendingExpenses,
    ];
    if (!options.compare) return base;
    const variations = month.isInProgress
      ? ["", "", ""]
      : [
          csvVariation(computeVariation(current.actualRevenue, previous.actualRevenue)),
          csvVariation(computeVariation(current.actualCost, previous.actualCost)),
          csvVariation(computeVariation(current.actualMargin, previous.actualMargin)),
        ];
    return [
      ...base,
      previous.period,
      previous.actualRevenue,
      previous.actualCost,
      previous.actualMargin,
      csvPct(computeMarginPct(previous.actualMargin, previous.actualRevenue)),
      previous.periodPersonnelCost ?? 0,
      previous.tripCount,
      ...variations,
    ];
  });

  return { headers, rows };
}
