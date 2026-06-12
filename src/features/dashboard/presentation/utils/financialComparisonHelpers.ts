import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import type { FinancialMonth } from "../../domain/types";

export function formatVariancePct(budgeted: number, actual: number): string {
  if (budgeted === 0) {
    return actual === 0 ? "0%" : "—";
  }
  const pct = ((actual - budgeted) / Math.abs(budgeted)) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function formatVarianceAmount(variance: number): string {
  const sign = variance > 0 ? "+" : "";
  return `${sign}${formatMxCurrencyWhole(variance)}`;
}

export function buildFinancialMonthDescription(fm: FinancialMonth): string {
  return [
    `Ingresos ${formatMxCurrencyWhole(fm.budgeted_revenue)} → ${formatMxCurrencyWhole(fm.actual_revenue)}`,
    `Costos ${formatMxCurrencyWhole(fm.budgeted_cost)} → ${formatMxCurrencyWhole(fm.actual_cost)}`,
    `Margen real ${formatMxCurrencyWhole(fm.actual_margin)} (mes)`,
  ].join(" · ");
}

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  if (!year || !month) return period;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
}
