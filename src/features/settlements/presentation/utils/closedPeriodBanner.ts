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

/**
 * Deriva el aviso de periodo cerrado desde backlog + summary KPIs.
 * Visible cuando hay operadores por armar (`pending` / `to_arm` > 0).
 */
export function resolveClosedPeriodBanner(
  summary: SettlementWorkbenchSummary,
  backlog: readonly SettlementBacklogRow[],
): ClosedPeriodBannerModel | null {
  const count = summary.kpis?.toArm.count ?? summary.pending;
  if (count <= 0 || backlog.length === 0) return null;

  const first = backlog[0]!;
  const periodStart = first.periodStart;
  const periodEnd = first.periodEnd;
  const week = isoWeekNumber(periodEnd || periodStart);
  const estimatedAmount =
    summary.kpis?.toArm.amount ??
    backlog.reduce((sum, row) => sum + (row.estimatedNetAmount ?? 0), 0);
  const warningsCount = backlog.filter((row) => row.warnings.length > 0).length;

  return {
    monthLabel: monthLabel(periodStart),
    dayRange: `${dayOfMonth(periodStart)}–${dayOfMonth(periodEnd)}`,
    weekLabel: String(week),
    operatorCount: count,
    estimatedAmount,
    warningsCount,
  };
}
