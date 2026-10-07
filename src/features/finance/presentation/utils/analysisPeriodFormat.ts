import {
  ANALYSIS_PERIOD_PRESET_MONTHS,
  monthPeriodDateRange,
  type ResolvedAnalysisPeriod,
} from "@features/finance/application";
import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import { formatMonthPeriodShort, parseMonthPeriod } from "@shared/utils/monthPeriod";
import { financeCopy } from "../copy";

const copy = financeCopy.analysisPeriod;

function isMonthStart(date: string): boolean {
  return date.endsWith("-01");
}

function isMonthEnd(date: string): boolean {
  return monthPeriodDateRange(date.slice(0, 7)).to === date;
}

function isWholeMonths(from: string, to: string): boolean {
  return isMonthStart(from) && isMonthEnd(to);
}

function monthsInclusive(fromMonth: string, toMonth: string): number {
  const start = parseMonthPeriod(fromMonth);
  const end = parseMonthPeriod(toMonth);
  if (!start || !end) return 0;
  return (end.year - start.year) * 12 + (end.month - start.month) + 1;
}

/** «oct 2025 a sep 2026» si son meses enteros; si no, días («06 oct 2026 a …»). */
export function formatAnalysisPeriodRange(from?: string, to?: string): string {
  if (from && to) {
    if (isWholeMonths(from, to)) {
      return copy.rangeLabel(
        formatMonthPeriodShort(from.slice(0, 7)),
        formatMonthPeriodShort(to.slice(0, 7)),
      );
    }
    return copy.rangeLabel(formatDate(from), formatDate(to));
  }
  if (from) return copy.since(formatDate(from));
  if (to) return copy.until(formatDate(to));
  return "";
}

/** «12 meses completos» / «mes en curso»; vacío si el rango no es de meses enteros. */
export function analysisPeriodDetail(
  period: ResolvedAnalysisPeriod,
  today: string = getTodayString(),
): string | undefined {
  if (period.choice === "this_month") return copy.currentMonth;
  if (period.choice !== "custom") {
    return copy.completedMonths(ANALYSIS_PERIOD_PRESET_MONTHS[period.choice]);
  }
  const { from, to } = period;
  if (!from || !to || !isWholeMonths(from, to)) return undefined;
  const currentMonth = today.slice(0, 7);
  const toMonth = to.slice(0, 7);
  if (toMonth >= currentMonth) {
    return from.slice(0, 7) === currentMonth ? copy.currentMonth : undefined;
  }
  return copy.completedMonths(monthsInclusive(from.slice(0, 7), toMonth));
}

/** «Periodo: oct 2025 a sep 2026 · 12 meses completos». */
export function formatAnalysisPeriodCaption(
  period: ResolvedAnalysisPeriod,
  today: string = getTodayString(),
): string {
  return copy.caption(
    formatAnalysisPeriodRange(period.from, period.to),
    analysisPeriodDetail(period, today),
  );
}
