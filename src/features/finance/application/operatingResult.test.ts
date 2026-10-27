import { describe, expect, it } from "vitest";
import type { MonthlyPerformance, PeriodFinancials } from "@features/finance/domain";
import {
  resolveOperatingResultWindow,
  summarizeOperatingResult,
  supportsOperatingResult,
} from "./operatingResult";

const TODAY = "2026-10-26";

function row(
  period: string,
  values: Partial<PeriodFinancials> & {
    revenue?: number;
    expenses?: number;
    commission?: number;
    personnel?: number;
  } = {},
): PeriodFinancials {
  const revenue = values.revenue ?? 0;
  const expenses = values.expenses ?? 0;
  const commission = values.commission ?? 0;
  const operationalCost = expenses + commission;
  return {
    period,
    actualRevenue: revenue,
    actualCost: operationalCost,
    actualMargin: revenue - operationalCost,
    operationalCost,
    operationalMargin: revenue - operationalCost,
    tripExpensesCost: expenses,
    tripCommissionCost: commission,
    periodPersonnelCost: values.personnel,
    tripCount: 1,
    incompleteTripCount: 0,
    tripsWithPendingExpenses: 0,
    provisional: values.provisional ?? false,
  };
}

function performance(
  current: PeriodFinancials[],
  marginBasis: MonthlyPerformance["marginBasis"] = "operational",
): MonthlyPerformance {
  return {
    periods: current.map((item) => item.period),
    current,
    previous: [],
    marginBasis,
  };
}

describe("resolveOperatingResultWindow", () => {
  it("default last 12 complete months requests 13 (shares cache with Tendencia)", () => {
    const window = resolveOperatingResultWindow(
      { from: "2025-10-01", to: "2026-09-30" },
      TODAY,
    );
    expect(window.months).toHaveLength(12);
    expect(window.months[0]).toBe("2025-10");
    expect(window.months.at(-1)).toBe("2026-09");
    expect(window.requestMonths).toBe(13);
    expect(window.aligned).toBe(true);
    expect(window.truncated).toBe(false);
  });

  it("this month = only the month in progress", () => {
    const window = resolveOperatingResultWindow(
      { from: "2026-10-01", to: "2026-10-31" },
      TODAY,
    );
    expect(window).toEqual({
      months: ["2026-10"],
      requestMonths: 1,
      aligned: true,
      truncated: false,
    });
  });

  it("custom range not aligned to months takes every month it touches", () => {
    const window = resolveOperatingResultWindow(
      { from: "2026-07-15", to: "2026-08-10" },
      TODAY,
    );
    expect(window.months).toEqual(["2026-07", "2026-08"]);
    expect(window.requestMonths).toBe(4);
    expect(window.aligned).toBe(false);
  });

  it("caps at 24 months back and flags truncation", () => {
    const window = resolveOperatingResultWindow(
      { from: "2023-01-01", to: "2026-09-30" },
      TODAY,
    );
    expect(window.truncated).toBe(true);
    expect(window.months[0]).toBe("2024-11");
    expect(window.requestMonths).toBe(24);
  });

  it("does not ask for future months", () => {
    const window = resolveOperatingResultWindow(
      { from: "2026-09-01", to: "2026-12-31" },
      TODAY,
    );
    expect(window.months).toEqual(["2026-09", "2026-10"]);
    expect(window.requestMonths).toBe(2);
  });
});

describe("summarizeOperatingResult", () => {
  const data = performance([
    row("2026-08", { revenue: 1000, expenses: 300, commission: 100, personnel: 50 }),
    row("2026-09", { revenue: 2000, expenses: 500, commission: 200.5, personnel: 70 }),
    row("2026-10", { revenue: 400, expenses: 50, commission: 0, personnel: 10 }),
  ]);

  it("sums the cascade of the selected months without subtracting the subtotal twice", () => {
    const result = summarizeOperatingResult(data, ["2026-08", "2026-09"]);
    expect(result).not.toBeNull();
    expect(result!.revenue).toBe(3000);
    expect(result!.tripExpenses).toBe(800);
    expect(result!.tripCommission).toBeCloseTo(300.5, 2);
    expect(result!.operationalCost).toBeCloseTo(
      result!.tripExpenses + result!.tripCommission,
      2,
    );
    expect(result!.operationalMargin).toBeCloseTo(
      result!.revenue - result!.operationalCost,
      2,
    );
    expect(result!.personnelCost).toBe(120);
    expect(result!.afterPersonnel).toBeCloseTo(result!.operationalMargin - 120, 2);
    expect(result!.provisional).toBe(false);
  });

  it("is provisional when it includes the month in progress", () => {
    expect(summarizeOperatingResult(data, ["2026-10"])?.provisional).toBe(true);
  });

  it("is provisional when a closed month is provisional", () => {
    const provisional = performance([
      row("2026-09", { revenue: 100, expenses: 10, provisional: true }),
      row("2026-10", { revenue: 0 }),
    ]);
    expect(summarizeOperatingResult(provisional, ["2026-09"])?.provisional).toBe(true);
  });

  it("hides when margin basis is trip_expenses or missing", () => {
    expect(
      summarizeOperatingResult({ ...data, marginBasis: "trip_expenses" }, ["2026-08"]),
    ).toBeNull();
    expect(
      summarizeOperatingResult({ ...data, marginBasis: undefined }, ["2026-08"]),
    ).toBeNull();
  });

  it("hides when the API does not send the expense/commission split", () => {
    const oldApi = performance([
      { ...row("2026-09", { revenue: 100 }), tripExpensesCost: undefined },
      row("2026-10"),
    ]);
    expect(summarizeOperatingResult(oldApi, ["2026-09"])).toBeNull();
  });

  it("hides while the series does not cover the requested months", () => {
    expect(summarizeOperatingResult(data, ["2026-06", "2026-07"])).toBeNull();
    expect(summarizeOperatingResult(undefined, ["2026-08"])).toBeNull();
    expect(summarizeOperatingResult(data, [])).toBeNull();
  });

  it("supportsOperatingResult mirrors the C4 visibility rule", () => {
    expect(supportsOperatingResult(data)).toBe(true);
    expect(supportsOperatingResult({ ...data, marginBasis: "trip_expenses" })).toBe(false);
    expect(
      supportsOperatingResult(
        performance([{ ...row("2026-10"), tripCommissionCost: undefined }]),
      ),
    ).toBe(false);
    expect(supportsOperatingResult(undefined)).toBe(false);
  });

  it("leaves personnel rows out when the API sends no personnel", () => {
    const noPersonnel = performance([
      row("2026-09", { revenue: 100, expenses: 20 }),
      row("2026-10"),
    ]);
    const result = summarizeOperatingResult(noPersonnel, ["2026-09"]);
    expect(result?.personnelCost).toBeNull();
    expect(result?.afterPersonnel).toBeNull();
  });
});
