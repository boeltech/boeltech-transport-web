import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { ChartSeries } from "@shared/ui/data-display";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  formatMonthAbbr,
  formatMonthPeriodShort,
} from "@shared/utils/monthPeriod";

export type FinanceChartGranularity = "day" | "week" | "month";

/** `2026-09-01` → `sep 2026`, igual que Rendimiento y el dashboard. */
export function formatFinancePeriodLabel(period: string): string {
  return formatMonthPeriodShort(period);
}

/**
 * Etiqueta de eje/tooltip del chart de Gasto de viaje.
 * El API entrega siempre `YYYY-MM-DD` (inicio de día / semana ISO lunes / mes).
 */
export function formatFinanceChartPeriodLabel(
  period: string,
  granularity: FinanceChartGranularity,
): string {
  if (granularity === "month") return formatMonthPeriodShort(period);
  if (granularity === "day") return formatDate(period);
  return formatWeekPeriodLabel(period);
}

/** Semana ISO (lunes → domingo): `6–12 oct` o `28 sep – 4 oct`. */
function formatWeekPeriodLabel(periodStart: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart)) return periodStart;
  const start = new Date(`${periodStart}T12:00:00Z`);
  if (Number.isNaN(start.getTime())) return periodStart;
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startMonth = start.getUTCMonth() + 1;
  const endMonth = end.getUTCMonth() + 1;
  const endYear = end.getUTCFullYear();

  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${formatMonthAbbr(endMonth)}`;
  }
  return `${startDay} ${formatMonthAbbr(startMonth)} – ${endDay} ${formatMonthAbbr(endMonth)} ${endYear}`;
}

export function formatFinanceReferencePeriod(period: string): string {
  const date = new Date(`${period}T00:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function financeCurrencyValueFormatter(
  value: ValueType,
): string {
  const numeric = Array.isArray(value) ? Number(value[0]) : Number(value);
  return formatMxCurrency(numeric);
}

export function financeCountValueFormatter(value: ValueType): string {
  const numeric = Array.isArray(value) ? Number(value[0]) : Number(value);
  return numeric.toLocaleString("es-MX");
}

export function filterNonZeroChartSlices<
  TRow extends { value: number },
>(
  data: TRow[],
  series: ChartSeries[],
): { data: TRow[]; series: ChartSeries[] } {
  const indices = data.reduce<number[]>((acc, row, index) => {
    if (row.value > 0) acc.push(index);
    return acc;
  }, []);

  return {
    data: indices.map((index) => data[index]!),
    series: indices.map((index) => series[index]!),
  };
}
