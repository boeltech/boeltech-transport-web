import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { FinancialMonth, FinancialTrendData } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  DashboardFinancialComparisonChart,
  type FinancialTrendMonths,
} from "./DashboardFinancialComparisonChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => (
    <div
      data-testid="bar-chart"
      data-points={data.length}
      data-last-period={(data.at(-1) as { period?: string } | undefined)?.period}
      data-last-label={(data.at(-1) as { label?: string } | undefined)?.label}
    >
      {children}
    </div>
  ),
  Bar: () => null,
  CartesianGrid: () => null,
  XAxis: ({
    dataKey,
    tickFormatter,
  }: {
    dataKey: string;
    tickFormatter?: (value: string, index: number) => string;
  }) => (
    <span data-testid="x-axis" data-key={dataKey}>
      {tickFormatter ? tickFormatter("2026-09", 3) : ""}
    </span>
  ),
  YAxis: ({ tickFormatter }: { tickFormatter?: (value: number) => string }) => (
    <span data-testid="y-axis-tick">
      {tickFormatter ? tickFormatter(600_000) : "600000"}
    </span>
  ),
  Tooltip: () => null,
}));

function buildFinancialMonth(
  overrides: Partial<FinancialMonth> = {},
): FinancialMonth {
  return {
    trip_count: 3,
    budgeted_revenue: 100_000,
    actual_revenue: 95_000,
    budgeted_cost: 60_000,
    actual_cost: 55_000,
    budgeted_margin: 40_000,
    actual_margin: 40_000,
    revenue_variance: -5_000,
    cost_variance: -5_000,
    margin_variance: 0,
    trips_with_pending_expenses: 0,
    ...overrides,
  };
}

function buildTrend(): FinancialTrendData {
  return {
    periods: ["2026-09", "2026-10"],
    budgeted_revenue: [90_000, 100_000],
    actual_revenue: [88_000, 95_000],
    budgeted_cost: [50_000, 60_000],
    actual_cost: [52_000, 55_000],
  };
}

function renderChart(
  props: {
    financialMonth?: FinancialMonth | null;
    trend?: FinancialTrendData;
    months?: FinancialTrendMonths;
    onMonthsChange?: (months: FinancialTrendMonths) => void;
  } = {},
) {
  return render(
    <MemoryRouter>
      <DashboardFinancialComparisonChart
        isLoading={false}
        financialMonth={
          "financialMonth" in props ? props.financialMonth : buildFinancialMonth()
        }
        trend={"trend" in props ? props.trend : buildTrend()}
        months={props.months ?? 12}
        onMonthsChange={props.onMonthsChange ?? vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe("DashboardFinancialComparisonChart", () => {
  it("renders actionable link when there are trips with pending expenses", () => {
    renderChart({
      financialMonth: buildFinancialMonth({ trips_with_pending_expenses: 2 }),
    });

    const link = screen.getByRole("link", {
      name: "Ir a aprobaciones de gastos en cola",
    });
    expect(link).toHaveAttribute(
      "href",
      "/finance/approvals?status=pending&type=trip_expense",
    );
  });

  it("does not render pending expenses alert when count is zero", () => {
    renderChart({
      financialMonth: buildFinancialMonth({ trips_with_pending_expenses: 0 }),
    });

    expect(
      screen.queryByRole("link", {
        name: "Ir a aprobaciones de gastos en cola",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows merged title, trend chart, month mini-KPIs and profitability link", () => {
    renderChart();

    expect(
      screen.getByText(dashboardCopy.financialComparison.title),
    ).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.financialComparison.miniKpis.revenueVariance),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tarifa pactada/)).toBeInTheDocument();
    expect(screen.getByText(/Costo estimado/)).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.financialComparison.miniKpis.actualMargin),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Presupuestado/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: dashboardCopy.financialComparison.viewProfitability,
      }),
    ).toHaveAttribute("href", "/finance/analysis?view=margin");
    expect(
      screen.getByRole("link", {
        name: dashboardCopy.financialComparison.compareWithPreviousYear,
      }),
    ).toHaveAttribute("href", "/finance/analysis?view=performance");
  });

  it("keeps the trend when the current month has no completed trips", () => {
    renderChart({ financialMonth: buildFinancialMonth({ trip_count: 0 }) });

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.financialComparison.monthEmpty),
    ).toBeInTheDocument();
  });

  it("shows empty state without trend data nor month trips", () => {
    renderChart({
      financialMonth: buildFinancialMonth({ trip_count: 0 }),
      trend: undefined,
    });

    expect(
      screen.getByText(dashboardCopy.financialComparison.empty.title),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });

  it("plots the full month window with a compact currency Y axis", () => {
    const { unmount } = renderChart({ months: 6 });
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-points", "6");
    expect(screen.getByTestId("y-axis-tick")).toHaveTextContent("$600 k");
    unmount();

    renderChart({ months: 12 });
    expect(screen.getByTestId("bar-chart")).toHaveAttribute("data-points", "12");
  });

  it("uses short month ticks keyed by period on the X axis", () => {
    renderChart();
    const axis = screen.getByTestId("x-axis");
    expect(axis).toHaveAttribute("data-key", "period");
    expect(axis).toHaveTextContent(/^sep$/);
  });

  it("reads «Igual a lo pactado/estimado» instead of $0 when actual equals plan", () => {
    renderChart({
      financialMonth: buildFinancialMonth({
        budgeted_revenue: 78_500,
        actual_revenue: 78_500,
        revenue_variance: 0,
        budgeted_cost: 4_981,
        actual_cost: 4_981,
        cost_variance: 0,
      }),
    });

    const copy = dashboardCopy.financialComparison.miniKpis;
    expect(screen.getByText(copy.equalToAgreed)).toBeInTheDocument();
    expect(screen.getByText(copy.equalToEstimated)).toBeInTheDocument();
    expect(
      screen.getByText("Tarifa pactada $78,500 · Ingreso real $78,500"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Costo estimado $4,981 · Costo real $4,981"),
    ).toBeInTheDocument();
    expect(screen.queryByText("$0")).not.toBeInTheDocument();
  });

  it("says there is no estimated cost instead of a variance against $0", () => {
    renderChart({
      financialMonth: buildFinancialMonth({
        budgeted_cost: 0,
        actual_cost: 55_000,
        cost_variance: 55_000,
      }),
    });

    const copy = dashboardCopy.financialComparison.miniKpis;
    expect(screen.getByText(copy.noEstimatedCost)).toBeInTheDocument();
    expect(screen.getByText("Costo real $55,000")).toBeInTheDocument();
    expect(screen.queryByText("+$55,000")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.noAgreedRate)).not.toBeInTheDocument();
  });

  it("says there is no agreed rate instead of a variance against $0", () => {
    renderChart({
      financialMonth: buildFinancialMonth({
        budgeted_revenue: 0,
        actual_revenue: 95_000,
        revenue_variance: 95_000,
      }),
    });

    const copy = dashboardCopy.financialComparison.miniKpis;
    expect(screen.getByText(copy.noAgreedRate)).toBeInTheDocument();
    expect(screen.getByText("Ingreso real $95,000")).toBeInTheDocument();
    expect(screen.queryByText("+$95,000")).not.toBeInTheDocument();
  });

  it("changes the trend window from the month selector", async () => {
    const user = userEvent.setup();
    const onMonthsChange = vi.fn();
    renderChart({ months: 12, onMonthsChange });

    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.financialComparison.monthsOption(6),
      }),
    );

    expect(onMonthsChange).toHaveBeenCalledWith(6);
  });

  describe("current month anchor", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("anchors on the API's last period at 23:30 CDMX of the last day of the month", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-02-01T05:30:00Z"));

      renderChart({
        months: 6,
        trend: {
          periods: ["2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01"],
          budgeted_revenue: [0, 0, 0, 0, 0, 100_000],
          actual_revenue: [0, 0, 0, 0, 0, 95_000],
          budgeted_cost: [0, 0, 0, 0, 0, 60_000],
          actual_cost: [0, 0, 0, 0, 0, 55_000],
          currentPeriod: "2026-01",
        },
      });

      const chart = screen.getByTestId("bar-chart");
      expect(chart).toHaveAttribute("data-points", "6");
      expect(chart).toHaveAttribute("data-last-period", "2026-01");
      expect(chart).toHaveAttribute(
        "data-last-label",
        dashboardCopy.financialComparison.currentPeriodLabel("ene 2026"),
      );
    });
  });
});
