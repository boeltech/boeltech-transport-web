import type { SettlementCutSalaryPeriod } from "../../domain/settlementCut";

const SHORT_MONTH_ES = [
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

const RHYTHM_TITLE: Record<SettlementCutSalaryPeriod, string> = {
  weekly: "Corte semanal",
  biweekly: "Corte quincenal",
  monthly: "Corte mensual",
};

function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { year: y!, month: m! - 1, day: d! };
}

/** Rango es-MX corto: `7 al 13 sep 2026` (C32). */
export function formatCutPeriodRange(periodStart: string, periodEnd: string): string {
  const s = parseIsoDate(periodStart);
  const e = parseIsoDate(periodEnd);
  const startMonth = SHORT_MONTH_ES[s.month]!;
  const endMonth = SHORT_MONTH_ES[e.month]!;

  if (s.year === e.year && s.month === e.month) {
    return `${s.day} al ${e.day} ${endMonth} ${e.year}`;
  }
  if (s.year === e.year) {
    return `${s.day} ${startMonth} al ${e.day} ${endMonth} ${e.year}`;
  }
  return `${s.day} ${startMonth} ${s.year} al ${e.day} ${endMonth} ${e.year}`;
}

export function formatCutWizardTitle(args: {
  salaryPeriod: SettlementCutSalaryPeriod;
  periodStart: string;
  periodEnd: string;
  /** Desde Revisar (paso ≥ 1) incluye el rango. */
  includePeriodRange: boolean;
}): string {
  const base = RHYTHM_TITLE[args.salaryPeriod];
  if (!args.includePeriodRange) return base;
  return `${base} · ${formatCutPeriodRange(args.periodStart, args.periodEnd)}`;
}
