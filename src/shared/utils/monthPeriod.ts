/** Abreviaturas fijas: `Intl` varía entre motores ("sept", "sept.", …). */
const MONTH_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

export interface MonthPeriodParts {
  year: number;
  month: number;
}

/** Acepta `YYYY-MM` o `YYYY-MM-DD`. */
export function parseMonthPeriod(period: string): MonthPeriodParts | null {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) return null;
  return { year, month };
}

export function formatMonthAbbr(month: number): string {
  return MONTH_SHORT_ES[month - 1] ?? "";
}

/** `2026-01` / `2026-01-01` → `ene 2026`. */
export function formatMonthPeriodShort(period: string): string {
  const parsed = parseMonthPeriod(period);
  if (!parsed) return period;
  return `${formatMonthAbbr(parsed.month)} ${parsed.year}`;
}

/**
 * Etiqueta corta de eje: solo el mes (`sep`), con año en el primer tick visible
 * y en enero (`nov 2025`, `ene 2026`). `index` = posición entre los ticks visibles.
 */
export function formatMonthPeriodAxis(period: string, index: number): string {
  const parsed = parseMonthPeriod(period);
  if (!parsed) return period;
  const monthLabel = formatMonthAbbr(parsed.month);
  return index === 0 || parsed.month === 1
    ? `${monthLabel} ${parsed.year}`
    : monthLabel;
}

/** Desplaza un periodo `YYYY-MM` `deltaMonths` meses (negativo = hacia atrás). */
export function shiftMonthPeriod(period: string, deltaMonths: number): string {
  const parsed = parseMonthPeriod(period);
  if (!parsed) return period;
  const index = parsed.year * 12 + (parsed.month - 1) + deltaMonths;
  const shiftedYear = Math.floor(index / 12);
  const shiftedMonth = index - shiftedYear * 12 + 1;
  return `${shiftedYear}-${String(shiftedMonth).padStart(2, "0")}`;
}

/** Los `months` periodos `YYYY-MM` que terminan en `lastPeriod`, en orden ascendente. */
export function buildTrailingMonthPeriods(
  lastPeriod: string,
  months: number,
): string[] {
  const count = Math.max(0, Math.floor(months));
  return Array.from({ length: count }, (_, index) =>
    shiftMonthPeriod(lastPeriod, index - (count - 1)),
  );
}
