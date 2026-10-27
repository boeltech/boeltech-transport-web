/**
 * Resultado operativo del hub Análisis (suma vertical, ATF): suma la serie
 * mensual de `GET /finance/performance/monthly` sobre los meses que toca el
 * periodo `from`/`to` del hub. Sin fórmulas nuevas (ADR-0108): solo suma
 * campos del API.
 */

import type { MonthlyPerformance, PeriodFinancials } from "@features/finance/domain";
import { parseMonthPeriod, shiftMonthPeriod } from "@shared/utils/monthPeriod";
import { monthPeriodDateRange } from "./analysisPeriod";
import { alignPerformanceMonths } from "./monthlyPerformance";

/** Tope del endpoint monthly (`months` ≤ 24, incluido el mes en curso). */
export const OPERATING_RESULT_MAX_MONTHS = 24;

export interface OperatingResultWindow {
  /** Meses `YYYY-MM` a sumar, en orden. */
  months: string[];
  /** Valor de `months` a pedir al API (desde el primer mes hasta el mes en curso). */
  requestMonths: number;
  /** `from` empieza en día 1 y `to` termina en fin de mes. */
  aligned: boolean;
  /** Se descartaron meses anteriores al tope de 24. */
  truncated: boolean;
}

function monthIndex(period: string): number {
  const parsed = parseMonthPeriod(period);
  return parsed ? parsed.year * 12 + (parsed.month - 1) : 0;
}

function isMonthStart(date: string): boolean {
  return date.slice(8, 10) === "01";
}

function isMonthEnd(date: string): boolean {
  return monthPeriodDateRange(date.slice(0, 7)).to === date;
}

export function resolveOperatingResultWindow(
  period: { from?: string; to?: string },
  today: string,
): OperatingResultWindow {
  const currentMonth = today.slice(0, 7);
  const earliestAllowed = shiftMonthPeriod(
    currentMonth,
    -(OPERATING_RESULT_MAX_MONTHS - 1),
  );
  const requestedTo = period.to ? period.to.slice(0, 7) : currentMonth;
  const toMonth = requestedTo > currentMonth ? currentMonth : requestedTo;
  const fromMonth = period.from ? period.from.slice(0, 7) : earliestAllowed;
  const truncated = fromMonth < earliestAllowed;
  const startMonth = truncated ? earliestAllowed : fromMonth;
  const aligned =
    (!period.from || isMonthStart(period.from)) &&
    (!period.to || isMonthEnd(period.to));

  if (startMonth > toMonth) {
    return { months: [], requestMonths: 1, aligned, truncated };
  }

  const count = monthIndex(toMonth) - monthIndex(startMonth) + 1;
  const months = Array.from({ length: count }, (_, index) =>
    shiftMonthPeriod(startMonth, index),
  );
  return {
    months,
    requestMonths: monthIndex(currentMonth) - monthIndex(startMonth) + 1,
    aligned,
    truncated,
  };
}

export interface OperatingResult {
  revenue: number;
  tripExpenses: number;
  tripCommission: number;
  /** Subtotal informativo (gasto + comisión); no se vuelve a restar. */
  operationalCost: number;
  operationalMargin: number;
  /** `null` si el API no envía personal de periodo. */
  personnelCost: number | null;
  afterPersonnel: number | null;
  /** Algún mes sumado es provisional o es el mes en curso. */
  provisional: boolean;
  months: string[];
}

type CascadeRow = PeriodFinancials &
  Required<
    Pick<
      PeriodFinancials,
      "tripExpensesCost" | "tripCommissionCost" | "operationalCost" | "operationalMargin"
    >
  >;

function hasCascadeFields(row: PeriodFinancials): row is CascadeRow {
  return (
    row.tripExpensesCost != null &&
    row.tripCommissionCost != null &&
    row.operationalCost != null &&
    row.operationalMargin != null
  );
}

/** Base operativa y desglose gasto/comisión presentes (C4): el hub muestra el Resultado. */
export function supportsOperatingResult(data: MonthlyPerformance | undefined): boolean {
  return (
    data?.marginBasis === "operational" &&
    data.current.length > 0 &&
    data.current.every(hasCascadeFields)
  );
}

/**
 * `null` = no se muestra el Resultado: base distinta de `operational`, API sin
 * desglose gasto/comisión, o la serie no cubre los meses pedidos.
 */
export function summarizeOperatingResult(
  data: MonthlyPerformance | undefined,
  months: readonly string[],
): OperatingResult | null {
  if (!data || data.marginBasis !== "operational" || months.length === 0) {
    return null;
  }
  const byPeriod = new Map(
    alignPerformanceMonths(data).map((month) => [month.period, month]),
  );
  const selected = months.flatMap((period) => {
    const month = byPeriod.get(period);
    return month ? [month] : [];
  });
  if (selected.length !== months.length) return null;
  const rows = selected.map((month) => month.current);
  if (!rows.every(hasCascadeFields)) return null;

  const sum = (pick: (row: CascadeRow) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);
  const operationalMargin = sum((row) => row.operationalMargin);
  const hasPersonnel = rows.some((row) => row.periodPersonnelCost != null);
  const personnelCost = hasPersonnel
    ? rows.reduce((total, row) => total + (row.periodPersonnelCost ?? 0), 0)
    : null;

  return {
    revenue: sum((row) => row.actualRevenue),
    tripExpenses: sum((row) => row.tripExpensesCost),
    tripCommission: sum((row) => row.tripCommissionCost),
    operationalCost: sum((row) => row.operationalCost),
    operationalMargin,
    personnelCost,
    afterPersonnel: personnelCost == null ? null : operationalMargin - personnelCost,
    provisional: selected.some(
      (month) => month.isInProgress || month.current.provisional,
    ),
    months: [...months],
  };
}
