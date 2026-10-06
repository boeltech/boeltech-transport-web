import { getTodayString } from "@shared/utils/dateUtils";
import { formatMxCurrencyWhole } from "@shared/utils/formatMxCurrency";
import {
  buildTrailingMonthPeriods,
  formatMonthPeriodShort,
} from "@shared/utils/monthPeriod";
import type { FinancialTrendData } from "../../domain/types";

export function formatVarianceAmount(variance: number): string {
  const sign = variance > 0 ? "+" : "";
  return `${sign}${formatMxCurrencyWhole(variance)}`;
}

export type PlanVariance =
  | { kind: "no_plan" }
  | { kind: "equal" }
  | { kind: "variance"; value: string };

/**
 * Variación contra lo pactado/estimado. Sin plan (0) comparar no dice nada;
 * variación 0 en pesos se lee como «igual», no como un monto `$0`.
 */
export function describePlanVariance(planned: number, variance: number): PlanVariance {
  if (planned === 0) return { kind: "no_plan" };
  if (Math.round(variance) === 0) return { kind: "equal" };
  return { kind: "variance", value: formatVarianceAmount(variance) };
}

/** `2026-09` → `sep 2026`. */
export function formatPeriodLabel(period: string): string {
  return formatMonthPeriodShort(period);
}

/**
 * Mes en curso de la tendencia: lo fija el API (`current_period` o el último
 * periodo de la serie densa), igual que en Rendimiento. Sin periodos, el mes
 * de hoy en CDMX (`today` = `YYYY-MM-DD`).
 */
export function getTrendCurrentPeriod(
  trend: FinancialTrendData | undefined,
  today: string = getTodayString(),
): string {
  return trend?.currentPeriod || trend?.periods.at(-1) || today.slice(0, 7);
}

export interface FinancialTrendChartRow {
  [key: string]: string | number;
  /** `YYYY-MM`: categoría del eje X (tick corto). */
  period: string;
  /** Mes completo para el tooltip, con «(en curso)» en el mes actual. */
  label: string;
  actualRevenue: number;
  actualCost: number;
}

/**
 * Los `months` meses que terminan en `currentPeriod`, con ceros donde el API no
 * trae datos. Periodos fuera de la ventana se ignoran (Rendimiento tampoco los cuenta).
 */
export function buildFinancialTrendChartData(
  trend: FinancialTrendData | undefined,
  options: {
    months: number;
    currentPeriod: string;
    formatCurrentLabel: (label: string) => string;
  },
): FinancialTrendChartRow[] {
  if (!trend) return [];
  const { months, currentPeriod, formatCurrentLabel } = options;

  const byPeriod = new Map<string, { revenue: number; cost: number }>();
  trend.periods.forEach((period, index) => {
    byPeriod.set(period, {
      revenue: trend.actual_revenue[index] ?? 0,
      cost: trend.actual_cost[index] ?? 0,
    });
  });

  return buildTrailingMonthPeriods(currentPeriod, months).map((period) => {
    const label = formatPeriodLabel(period);
    const values = byPeriod.get(period);
    return {
      period,
      label: period === currentPeriod ? formatCurrentLabel(label) : label,
      actualRevenue: values?.revenue ?? 0,
      actualCost: values?.cost ?? 0,
    };
  });
}
