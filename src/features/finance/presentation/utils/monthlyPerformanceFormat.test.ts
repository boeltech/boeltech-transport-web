import { describe, expect, it } from "vitest";
import {
  alignPerformanceMonths,
  computeVariation,
} from "@features/finance/application";
import type { MonthlyPerformance } from "@features/finance/domain";
import {
  buildMonthlyPerformanceCsv,
  buildPerformanceChartRows,
  formatPerformanceMonth,
  formatPerformanceMonthWithStatus,
  formatVariationDetail,
  formatVariationPct,
} from "./monthlyPerformanceFormat";

const data: MonthlyPerformance = {
  periods: ["2025-12", "2026-01"],
  current: [
    {
      period: "2025-12",
      actualRevenue: 1000,
      actualCost: 600,
      actualMargin: 400,
      tripCount: 2,
    },
    {
      period: "2026-01",
      actualRevenue: 500,
      actualCost: 0,
      actualMargin: 500,
      tripCount: 1,
    },
  ],
  previous: [
    {
      period: "2024-12",
      actualRevenue: 800,
      actualCost: 500,
      actualMargin: 300,
      tripCount: 1,
    },
    {
      period: "2025-01",
      actualRevenue: 0,
      actualCost: 0,
      actualMargin: 0,
      tripCount: 0,
    },
  ],
};

describe("month labels", () => {
  it("formats periods in Spanish", () => {
    expect(formatPerformanceMonth("2026-01")).toBe("ene 2026");
    expect(formatPerformanceMonth("2025-09")).toBe("sep 2025");
    expect(formatPerformanceMonth("bad")).toBe("bad");
  });

  it("marks the month in progress", () => {
    expect(formatPerformanceMonthWithStatus("2026-10", true)).toBe(
      "oct 2026 (en curso)",
    );
    expect(formatPerformanceMonthWithStatus("2026-09", false)).toBe("sep 2026");
  });
});

describe("variation formatting", () => {
  it("shows sign and one decimal", () => {
    expect(formatVariationPct(computeVariation(1250, 1000))).toBe("+25.0%");
    expect(formatVariationPct(computeVariation(750, 1000))).toBe("−25.0%");
    expect(formatVariationPct(computeVariation(1000, 1000))).toBe("0.0%");
  });

  it("shows «Nuevo» or «—» instead of Infinity/NaN when previous is zero", () => {
    expect(formatVariationPct(computeVariation(500, 0))).toBe("Nuevo");
    expect(formatVariationPct(computeVariation(0, 0))).toBe("—");
    const all = [
      formatVariationPct(computeVariation(500, 0)),
      formatVariationPct(computeVariation(0, 0)),
      formatVariationDetail(computeVariation(500, 0)),
    ].join(" ");
    expect(all).not.toMatch(/Infinity|NaN/);
  });

  it("combines Δ$ and Δ% for tooltips", () => {
    expect(formatVariationDetail(computeVariation(1000, 800))).toBe(
      "+$200.00 (+25.0%)",
    );
    expect(formatVariationDetail(computeVariation(500, 0))).toBe("+$500.00 (Nuevo)");
    expect(formatVariationDetail(computeVariation(0, 0))).toBe("$0.00");
  });
});

describe("buildPerformanceChartRows", () => {
  it("keys rows by period and leaves margin null without revenue", () => {
    const rows = buildPerformanceChartRows(alignPerformanceMonths(data));
    expect(rows.map((row) => row.period)).toEqual(["2025-12", "2026-01"]);
    expect(rows[0]?.marginPct).toBe(40);
    expect(rows[0]?.previousMarginPct).toBe(37.5);
    expect(rows[1]?.previousMarginPct).toBeNull();
  });
});

describe("buildMonthlyPerformanceCsv", () => {
  const months = alignPerformanceMonths(data);

  it("exports the current range only when comparison is off", () => {
    const csv = buildMonthlyPerformanceCsv(months, { compare: false });
    expect(csv.headers).toEqual([
      "mes",
      "ingreso",
      "gasto",
      "margen",
      "margen_pct",
      "viajes",
    ]);
    expect(csv.rows).toEqual([
      ["2025-12", 1000, 600, 400, 40, 2],
      ["2026-01", 500, 0, 500, 100, 1],
    ]);
  });

  it("adds previous-year columns and variation % when comparison is on", () => {
    const csv = buildMonthlyPerformanceCsv(months, { compare: true });
    expect(csv.headers).toEqual([
      "mes",
      "ingreso",
      "gasto",
      "margen",
      "margen_pct",
      "viajes",
      "mes_anio_anterior",
      "ingreso_anio_anterior",
      "gasto_anio_anterior",
      "margen_anio_anterior",
      "margen_pct_anio_anterior",
      "viajes_anio_anterior",
      "variacion_ingreso_pct",
      "variacion_gasto_pct",
      "variacion_margen_pct",
    ]);
    expect(csv.rows[0]).toEqual([
      "2025-12",
      1000,
      600,
      400,
      40,
      2,
      "2024-12",
      800,
      500,
      300,
      37.5,
      1,
      25,
      20,
      33.33,
    ]);
    expect(csv.rows[1]).toEqual([
      "2026-01",
      500,
      0,
      500,
      100,
      1,
      "2025-01",
      0,
      0,
      0,
      "",
      0,
      "nuevo",
      "",
      "nuevo",
    ]);
  });
});
