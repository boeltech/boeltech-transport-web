import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PerformanceTotals } from "@features/finance/application";
import { PerformanceKpiCards } from "./PerformanceKpiCards";

const current: PerformanceTotals = {
  revenue: 12_000,
  cost: 6_000,
  margin: 6_000,
  marginPct: 50,
  tripCount: 4,
};

const previous: PerformanceTotals = {
  revenue: 10_000,
  cost: 5_000,
  margin: 5_000,
  marginPct: 50,
  tripCount: 3,
};

describe("PerformanceKpiCards", () => {
  it("shows range totals with absolute amount first and margin % as complement", () => {
    render(<PerformanceKpiCards current={current} previous={previous} compare={false} />);

    expect(screen.getByText("$12,000.00")).toBeInTheDocument();
    expect(screen.getAllByText("$6,000.00")).toHaveLength(2);
    expect(screen.getByText("4 viajes completados")).toBeInTheDocument();
    expect(screen.getAllByText("50.0% del ingreso")).toHaveLength(2);
    expect(screen.queryByText(/año anterior/)).not.toBeInTheDocument();
  });

  it("compares against last year with semantic colors (cost up is bad)", () => {
    render(<PerformanceKpiCards current={current} previous={previous} compare />);

    expect(screen.getByText("vs $10,000.00 año anterior")).toBeInTheDocument();
    expect(screen.getAllByText("vs $5,000.00 año anterior")).toHaveLength(2);

    const variations = screen.getAllByLabelText("subió +20.0%");
    expect(variations).toHaveLength(3);
    const [revenue, cost, margin] = variations;
    expect(revenue).toHaveClass("text-success");
    expect(cost).toHaveClass("text-destructive");
    expect(margin).toHaveClass("text-success");
    expect(screen.getByText("Margen del año anterior: 50.0%")).toBeInTheDocument();
  });

  it("shows «Nuevo» and «—» when last year has no data", () => {
    render(
      <PerformanceKpiCards
        current={{ ...current, cost: 0, margin: 12_000, marginPct: 100 }}
        previous={{ revenue: 0, cost: 0, margin: 0, marginPct: null, tripCount: 0 }}
        compare
      />,
    );

    expect(screen.getAllByText("Nuevo")).toHaveLength(2);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    expect(document.body.textContent).not.toMatch(/Infinity|NaN/);
  });

  it("shows the period caption above the KPIs", () => {
    const note =
      "Totales de oct 2025 a sep 2026 · 12 meses completos. oct 2026 va en curso y se suma al terminar el mes.";
    render(
      <PerformanceKpiCards
        current={current}
        previous={previous}
        compare
        periodNote={note}
      />,
    );
    expect(screen.getByText(note)).toBeInTheDocument();
  });

  it("in «only the month in progress» mode shows its amounts without comparison nor $0.00", () => {
    const note = "oct 2026 (en curso) · aún no hay meses completos para sumar ni comparar.";
    render(
      <PerformanceKpiCards
        current={{ revenue: 700, cost: 200, margin: 500, marginPct: 71.43, tripCount: 2 }}
        previous={{ revenue: 0, cost: 0, margin: 0, marginPct: null, tripCount: 0 }}
        compare={false}
        periodNote={note}
      />,
    );
    expect(screen.getByText(note)).toBeInTheDocument();
    expect(screen.getByText("$700.00")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
    expect(screen.queryByText(/año anterior/)).not.toBeInTheDocument();
  });
});
