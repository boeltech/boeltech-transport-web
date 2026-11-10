import type {
  SettlementBacklogRow,
  SettlementWorkbenchSummary,
} from "../../domain/entities";
import type { ClosedPeriodBannerModel } from "../components/SettlementClosedPeriodBanner";

const MONTH_SHORT_ES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
] as const;

/** Semana ISO (1–53) a partir de fecha calendario `YYYY-MM-DD`. */
export function isoWeekNumber(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function dayOfMonth(isoDate: string): number {
  return Number(isoDate.slice(8, 10));
}

function monthLabel(isoDate: string): string {
  const month = Number(isoDate.slice(5, 7));
  return MONTH_SHORT_ES[month - 1] ?? "";
}

function periodKey(row: Pick<SettlementBacklogRow, "periodStart" | "periodEnd">): string {
  return `${row.periodStart}|${row.periodEnd}`;
}

/**
 * Deriva el aviso de periodo cerrado desde backlog + summary KPIs.
 * El título solo cuenta operadores del periodo anunciado (D4 / C7).
 */
export function resolveClosedPeriodBanner(
  summary: SettlementWorkbenchSummary,
  backlog: readonly SettlementBacklogRow[],
): ClosedPeriodBannerModel | null {
  const kpiCount = summary.kpis?.toArm.count ?? summary.pending;
  if (kpiCount <= 0 || backlog.length === 0) return null;

  const first = backlog[0]!;
  const announcedStart = first.periodStart;
  const announcedEnd = first.periodEnd;
  const announcedKey = periodKey(first);

  const samePeriod = backlog.filter((row) => periodKey(row) === announcedKey);
  const otherPeriodCount = backlog.length - samePeriod.length;

  const homogeneous =
    samePeriod.length > 0 &&
    Boolean(announcedStart) &&
    Boolean(announcedEnd);

  const operatorCount = samePeriod.length;
  const estimatedAmount = samePeriod.reduce(
    (sum, row) => sum + (row.estimatedNetAmount ?? 0),
    0,
  );
  const warningsCount = samePeriod.filter((row) => row.warnings.length > 0)
    .length;

  if (!homogeneous) {
    return {
      monthLabel: monthLabel(announcedStart || announcedEnd),
      dayRange: announcedStart && announcedEnd
        ? `${dayOfMonth(announcedStart)}–${dayOfMonth(announcedEnd)}`
        : "—",
      weekLabel: "",
      operatorCount: backlog.length,
      estimatedAmount:
        summary.kpis?.toArm.amount ??
        backlog.reduce((sum, row) => sum + (row.estimatedNetAmount ?? 0), 0),
      warningsCount: backlog.filter((row) => row.warnings.length > 0).length,
      otherPeriodsCount: 0,
      periodStart: announcedStart,
      periodEnd: announcedEnd,
      namedWeek: false,
    };
  }

  const week = isoWeekNumber(announcedEnd || announcedStart);

  return {
    monthLabel: monthLabel(announcedStart),
    dayRange: `${dayOfMonth(announcedStart)}–${dayOfMonth(announcedEnd)}`,
    weekLabel: String(week),
    operatorCount,
    estimatedAmount:
      otherPeriodCount === 0 && summary.kpis?.toArm.amount != null
        ? summary.kpis.toArm.amount
        : estimatedAmount,
    warningsCount,
    otherPeriodsCount: otherPeriodCount,
    periodStart: announcedStart,
    periodEnd: announcedEnd,
    namedWeek: true,
  };
}
