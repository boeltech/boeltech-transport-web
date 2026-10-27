import {
  ANALYSIS_PERIOD_PRESET_MONTHS,
  analysisPeriodIncludesCurrentMonth,
  monthPeriodDateRange,
  type ResolvedAnalysisPeriod,
} from "@features/finance/application";
import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import { formatMonthAbbr, parseMonthPeriod } from "@shared/utils/monthPeriod";
import { financeCopy } from "../copy";

const copy = financeCopy.analysisPeriod;

const MONTH_LONG_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

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

/** `2026-10` → «octubre 2026». */
export function formatMonthLong(monthKey: string): string {
  const parsed = parseMonthPeriod(monthKey);
  if (!parsed) return monthKey;
  return `${MONTH_LONG_ES[parsed.month - 1]} ${parsed.year}`;
}

/** `2026-07`…`2026-09` → «jul–sep 2026»; entre años «oct 2025–sep 2026». */
export function formatMonthSpan(fromMonth: string, toMonth: string): string {
  const start = parseMonthPeriod(fromMonth);
  const end = parseMonthPeriod(toMonth);
  if (!start || !end) return `${fromMonth}–${toMonth}`;
  if (fromMonth === toMonth) return `${formatMonthAbbr(start.month)} ${start.year}`;
  if (start.year === end.year) {
    return `${formatMonthAbbr(start.month)}–${formatMonthAbbr(end.month)} ${end.year}`;
  }
  return `${formatMonthAbbr(start.month)} ${start.year}–${formatMonthAbbr(end.month)} ${end.year}`;
}

/** `2026-10-06`…`2026-10-20` → «06–20 oct 2026». */
export function formatDaySpan(from: string, to: string): string {
  const [fromYear, fromMonth, fromDay] = from.split("-");
  const [toYear, toMonth, toDay] = to.split("-");
  const fromMonthLabel = formatMonthAbbr(Number(fromMonth));
  const toMonthLabel = formatMonthAbbr(Number(toMonth));
  if (fromYear !== toYear) {
    return `${fromDay} ${fromMonthLabel} ${fromYear}–${toDay} ${toMonthLabel} ${toYear}`;
  }
  if (fromMonth !== toMonth) {
    return `${fromDay} ${fromMonthLabel}–${toDay} ${toMonthLabel} ${toYear}`;
  }
  return `${fromDay}–${toDay} ${toMonthLabel} ${toYear}`;
}

/** `2026-10-26` → «26 oct». */
export function formatDayShort(date: string): string {
  const [, month, day] = date.split("-");
  return `${day} ${formatMonthAbbr(Number(month))}`;
}

/**
 * Mes entero: «Octubre 2026»; varios meses: «Oct 2025–sep 2026»;
 * días: «06–20 oct 2026 (días)».
 */
export function formatAnalysisPeriodRange(from?: string, to?: string): string {
  if (from && to) {
    if (isWholeMonths(from, to)) {
      const fromMonth = from.slice(0, 7);
      const toMonth = to.slice(0, 7);
      return capitalize(
        fromMonth === toMonth
          ? formatMonthLong(fromMonth)
          : formatMonthSpan(fromMonth, toMonth),
      );
    }
    return `${formatDaySpan(from, to)} ${copy.daysSuffix}`;
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

/** «Octubre 2026 · mes en curso · datos al 26 oct» (D3: corte si toca el mes en curso). */
export function formatAnalysisPeriodCaption(
  period: ResolvedAnalysisPeriod,
  today: string = getTodayString(),
): string {
  return copy.caption(
    formatAnalysisPeriodRange(period.from, period.to),
    analysisPeriodDetail(period, today),
    analysisPeriodIncludesCurrentMonth(period, today) ? formatDayShort(today) : undefined,
  );
}

/**
 * Caption sticky always-on del hub Análisis:
 * «Octubre 2026 · mes en curso · datos al 26 oct · <leyenda de bases>».
 */
export function formatAnalysisStickyCaption(
  period: ResolvedAnalysisPeriod,
  today: string = getTodayString(),
): string {
  return copy.stickyLine(formatAnalysisPeriodCaption(period, today));
}
