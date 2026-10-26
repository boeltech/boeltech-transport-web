import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type {
  AlignedPerformanceMonth,
  PerformanceTotals,
} from "@features/finance/application";
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

function alignedMonths(): AlignedPerformanceMonth[] {
  return [
    {
      period: "2025-12",
      isInProgress: false,
      current: {
        period: "2025-12",
        actualRevenue: 5_000,
        actualCost: 2_500,
        actualMargin: 2_500,
        tripCount: 2,
        incompleteTripCount: 0,
        tripsWithPendingExpenses: 0,
        provisional: false,
      },
      previous: {
        period: "2024-12",
        actualRevenue: 4_000,
        actualCost: 2_000,
        actualMargin: 2_000,
        tripCount: 1,
        incompleteTripCount: 0,
        tripsWithPendingExpenses: 0,
        provisional: false,
      },
    },
    {
      period: "2026-01",
      isInProgress: false,
      current: {
        period: "2026-01",
        actualRevenue: 7_000,
        actualCost: 3_500,
        actualMargin: 3_500,
        tripCount: 2,
        incompleteTripCount: 0,
        tripsWithPendingExpenses: 0,
        provisional: false,
      },
      previous: {
        period: "2025-01",
        actualRevenue: 6_000,
        actualCost: 3_000,
        actualMargin: 3_000,
        tripCount: 2,
        incompleteTripCount: 0,
        tripsWithPendingExpenses: 0,
        provisional: false,
      },
    },
  ];
}

describe("PerformanceKpiCards", () => {
  it("shows range totals with absolute amount first and margin % as complement", () => {
    render(<PerformanceKpiCards current={current} previous={previous} compare={false} />);

    expect(screen.getByText("$12,000.00")).toBeInTheDocument();
    expect(screen.getAllByText("$6,000.00")).toHaveLength(2);
    expect(screen.getByText("4 viajes completados")).toBeInTheDocument();
    expect(screen.getAllByText("50.0% del ingreso")).toHaveLength(2);
    expect(screen.queryByText(/año anterior/)).not.toBeInTheDocument();
  });

  it("highlights margin with success tone when non-negative", () => {
    render(<PerformanceKpiCards current={current} previous={previous} compare={false} />);
    const marginValue = screen.getAllByText("$6,000.00")[1]!;
    expect(marginValue).toHaveClass("text-success");
  });

  it("highlights margin with destructive tone when negative", () => {
    render(
      <PerformanceKpiCards
        current={{ ...current, margin: -500, marginPct: -4.2 }}
        previous={previous}
        compare={false}
      />,
    );
    expect(screen.getByText("-$500.00")).toHaveClass("text-destructive");
  });

  it("compares against last year with semantic colors (cost up is bad)", () => {
    render(<PerformanceKpiCards current={current} previous={previous} compare />);

    expect(screen.getByText(/vs \$10,000\.00 año anterior/)).toBeInTheDocument();
    expect(screen.getAllByText(/vs \$5,000\.00 año anterior/)).toHaveLength(2);

    const variations = screen.getAllByLabelText("subió +20.0%");
    expect(variations).toHaveLength(3);
    const [revenue, cost, margin] = variations;
    expect(revenue).toHaveClass("text-success");
    expect(cost).toHaveClass("text-destructive");
    expect(margin).toHaveClass("text-success");
    expect(screen.getByText(/Margen del año anterior: 50\.0%/)).toBeInTheDocument();
  });

  it("puts YoY in subtitle and sparklines in trend when months (≥2) are provided", () => {
    const { container } = render(
      <PerformanceKpiCards
        current={current}
        previous={previous}
        compare
        months={alignedMonths()}
      />,
    );

    // YoY sigue visible (subtitle de Ingreso/Margen; costo mantiene trend).
    expect(screen.getAllByLabelText("subió +20.0%")).toHaveLength(3);
    expect(screen.getByText(/vs \$10,000\.00 año anterior/)).toBeInTheDocument();
    expect(screen.getByText(/Margen del año anterior: 50\.0%/)).toBeInTheDocument();

    // Dos sparklines (Ingreso + Margen): ChartContainer height=40 (jsdom no pinta SVG).
    const sparkHosts = Array.from(container.querySelectorAll("div")).filter(
      (el) => (el as HTMLElement).style.height === "40px",
    );
    expect(sparkHosts.length).toBeGreaterThanOrEqual(2);
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

  it("shows a range provisional note without chips on the KPI cards", () => {
    const provisionalNote =
      "Hay meses provisionales en el total: el margen puede bajar cuando terminen viajes o se aprueben gastos.";
    render(
      <PerformanceKpiCards
        current={current}
        previous={previous}
        compare={false}
        provisionalNote={provisionalNote}
      />,
    );
    expect(screen.getByText(provisionalNote)).toBeInTheDocument();
    expect(screen.queryByText("Provisional")).not.toBeInTheDocument();
  });
});
