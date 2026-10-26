import { describe, expect, it } from "vitest";
import type { MonthlyPerformance, PeriodFinancials } from "@features/finance/domain";
import {
  FINANCE_PULSE_PERFORMANCE_MONTHS,
  pulseOperationalTotals,
  resolveFinancePulseMonth,
  toCollectedTrendData,
} from "./financePulse";

function period(
  key: string,
  revenue: number,
  operationalMargin: number,
): PeriodFinancials {
  return {
    period: key,
    actualRevenue: revenue,
    actualCost: 999,
    actualMargin: 888,
    operationalCost: revenue - operationalMargin,
    operationalMargin,
    periodPersonnelCost: 0,
    tripCount: 1,
    incompleteTripCount: 0,
    tripsWithPendingExpenses: 0,
    provisional: false,
  };
}

describe("resolveFinancePulseMonth", () => {
  it("toma el último periodo (mes en curso), no el primero", () => {
    const data: MonthlyPerformance = {
      periods: ["2026-09", "2026-10"],
      current: [period("2026-09", 100, 40), period("2026-10", 200, 80)],
      previous: [],
    };
    const row = resolveFinancePulseMonth(data);
    expect(row?.period).toBe("2026-10");
    expect(row?.actualRevenue).toBe(200);
  });

  it("devuelve null sin data", () => {
    expect(resolveFinancePulseMonth(undefined)).toBeNull();
  });
});

describe("pulseOperationalTotals", () => {
  it("usa operational_margin y actual_revenue; ignora actual_margin/actual_cost", () => {
    const row = period("2026-10", 1000, 350);
    const totals = pulseOperationalTotals(row);
    expect(totals.revenue).toBe(1000);
    expect(totals.operationalMargin).toBe(350);
    expect(totals.hasOperationalMargin).toBe(true);
    expect(totals.operationalMargin).not.toBe(row.actualMargin);
  });

  it("marca hasOperationalMargin false si falta el campo aditivo", () => {
    const row: PeriodFinancials = {
      ...period("2026-10", 1000, 0),
      operationalMargin: undefined,
      operationalCost: undefined,
    };
    expect(pulseOperationalTotals(row).hasOperationalMargin).toBe(false);
  });
});

describe("FINANCE_PULSE_PERFORMANCE_MONTHS", () => {
  it("pide el mínimo útil al API (mes en curso)", () => {
    expect(FINANCE_PULSE_PERFORMANCE_MONTHS).toBe(1);
  });
});

describe("toCollectedTrendData", () => {
  it("exige ≥2 puntos; si no, undefined (no half-wired)", () => {
    expect(toCollectedTrendData(undefined)).toBeUndefined();
    expect(
      toCollectedTrendData({ periods: ["2026-10"], collected: [100] }),
    ).toBeUndefined();
    expect(
      toCollectedTrendData({
        periods: ["2026-09", "2026-10"],
        collected: [100, 200],
      }),
    ).toEqual([{ value: 100 }, { value: 200 }]);
  });
});
