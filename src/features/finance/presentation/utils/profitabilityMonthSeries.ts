import type { ProfitabilityAggregateItem } from "@features/finance/domain";
import { formatFinancePeriodLabel } from "./financeChartHelpers";

export interface ProfitabilityMonthlyChartRow {
  [key: string]: string | number;
  label: string;
  revenue: number;
  actual: number;
  marginPct: number;
}

/**
 * El API de agregados no ordena por `key`: la serie mensual llega en el orden de una
 * métrica y se reordena aquí por `YYYY-MM` ascendente.
 */
export function sortProfitabilityMonthsChronologically(
  rows: readonly ProfitabilityAggregateItem[] | undefined,
): ProfitabilityAggregateItem[] {
  return [...(rows ?? [])].sort((a, b) =>
    a.key < b.key ? -1 : a.key > b.key ? 1 : 0,
  );
}

/** Filas de «Ingreso vs gasto real por mes», en orden cronológico y con mes legible (`sep 2026`). */
export function buildProfitabilityMonthlyChartRows(
  rows: readonly ProfitabilityAggregateItem[] | undefined,
): ProfitabilityMonthlyChartRow[] {
  return sortProfitabilityMonthsChronologically(rows).map((row) => ({
    label: formatFinancePeriodLabel(row.key),
    revenue: row.totalRevenue,
    actual: row.totalActual,
    marginPct: row.blendedMarginPct ?? 0,
  }));
}
