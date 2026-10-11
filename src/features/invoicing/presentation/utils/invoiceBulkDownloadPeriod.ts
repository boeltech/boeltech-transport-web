/**
 * Periodos YYYY-MM en calendario America/Mexico_City para descarga masiva.
 */

const MEXICO_TIME_ZONE = "America/Mexico_City";
const PERIOD_RE = /^\d{4}-\d{2}$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function isValidPeriodMonth(value: string): boolean {
  if (!PERIOD_RE.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

/** Mes civil actual en CDMX (`YYYY-MM`). */
export function getMexicoCityPeriodMonth(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MEXICO_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);
  return `${year}-${pad2(month)}`;
}

/** Mes civil anterior completo en CDMX (`YYYY-MM`). */
export function getPreviousMexicoCityPeriodMonth(
  now: Date = new Date(),
): string {
  const current = getMexicoCityPeriodMonth(now);
  return shiftPeriodMonth(current, -1);
}

export function shiftPeriodMonth(period: string, monthsDelta: number): string {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5));
  const total = year * 12 + (month - 1) + monthsDelta;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;
  return `${nextYear}-${pad2(nextMonth)}`;
}

/** Meses inclusivos entre from y to (YYYY-MM). */
export function inclusiveMonthSpan(periodFrom: string, periodTo: string): number {
  if (!isValidPeriodMonth(periodFrom) || !isValidPeriodMonth(periodTo)) {
    return 0;
  }
  const fy = Number(periodFrom.slice(0, 4));
  const fm = Number(periodFrom.slice(5));
  const ty = Number(periodTo.slice(0, 4));
  const tm = Number(periodTo.slice(5));
  return (ty - fy) * 12 + (tm - fm) + 1;
}

export function formatBulkPeriodLabel(
  periodFrom: string,
  periodTo: string,
): string {
  if (periodFrom === periodTo) return periodFrom;
  return `${periodFrom} a ${periodTo}`;
}
