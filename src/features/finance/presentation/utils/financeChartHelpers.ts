import type { ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { ChartSeries } from "@shared/ui/data-display";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

export function formatFinancePeriodLabel(period: string): string {
  const date = new Date(`${period}T00:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  return date.toLocaleDateString("es-MX", { month: "short", year: "2-digit" });
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
