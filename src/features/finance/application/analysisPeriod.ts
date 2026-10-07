/**
 * Periodo de Rentabilidad y Gastos (Finanzas › Análisis): opciones rápidas sobre
 * `from` / `to` (días civiles CDMX, inclusivos). «N meses» = N meses completos,
 * igual que Mes a mes; el mes en curso solo entra con «Este mes».
 */

import { getTodayString } from "@shared/utils/dateUtils";
import { shiftMonthPeriod } from "@shared/utils/monthPeriod";
import { getCurrentMonthExpenseRange, type FinanceDateRange } from "./expensePeriod";

export const ANALYSIS_PERIOD_PRESETS = [
  "this_month",
  "last_3",
  "last_6",
  "last_12",
] as const;

export type AnalysisPeriodPreset = (typeof ANALYSIS_PERIOD_PRESETS)[number];

export type AnalysisPeriodChoice = AnalysisPeriodPreset | "custom";

export const DEFAULT_ANALYSIS_PERIOD_PRESET: AnalysisPeriodPreset = "last_12";

export const ANALYSIS_PERIOD_PRESET_MONTHS: Record<
  Exclude<AnalysisPeriodPreset, "this_month">,
  number
> = {
  last_3: 3,
  last_6: 6,
  last_12: 12,
};

/** `2026-09` → `{ from: 2026-09-01, to: 2026-09-30 }`. */
export function monthPeriodDateRange(monthKey: string): FinanceDateRange {
  return getCurrentMonthExpenseRange(`${monthKey}-01`);
}

export function resolveAnalysisPeriodPreset(
  preset: AnalysisPeriodPreset,
  today: string = getTodayString(),
): FinanceDateRange {
  if (preset === "this_month") return getCurrentMonthExpenseRange(today);
  const currentMonth = today.slice(0, 7);
  const months = ANALYSIS_PERIOD_PRESET_MONTHS[preset];
  return {
    from: `${shiftMonthPeriod(currentMonth, -months)}-01`,
    to: monthPeriodDateRange(shiftMonthPeriod(currentMonth, -1)).to,
  };
}

export interface ResolvedAnalysisPeriod {
  from?: string;
  to?: string;
  choice: AnalysisPeriodChoice;
}

/** Sin `from` ni `to` en la URL = periodo por defecto (últimos 12 meses completos). */
export function resolveAnalysisPeriod(
  range: { from?: string | null; to?: string | null },
  today: string = getTodayString(),
): ResolvedAnalysisPeriod {
  const from = range.from || undefined;
  const to = range.to || undefined;
  if (!from && !to) {
    return {
      ...resolveAnalysisPeriodPreset(DEFAULT_ANALYSIS_PERIOD_PRESET, today),
      choice: DEFAULT_ANALYSIS_PERIOD_PRESET,
    };
  }
  const preset = ANALYSIS_PERIOD_PRESETS.find((candidate) => {
    const presetRange = resolveAnalysisPeriodPreset(candidate, today);
    return presetRange.from === from && presetRange.to === to;
  });
  return { from, to, choice: preset ?? "custom" };
}

/** `from` / `to` a escribir en la URL; el periodo por defecto se omite. */
export function analysisPeriodUrlRange(
  preset: AnalysisPeriodPreset,
  today: string = getTodayString(),
): FinanceDateRange {
  if (preset === DEFAULT_ANALYSIS_PERIOD_PRESET) return { from: "", to: "" };
  return resolveAnalysisPeriodPreset(preset, today);
}
