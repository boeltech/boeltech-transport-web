import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { FinancialMonth } from "../../domain/types";
import { DashboardFinancialComparisonChart } from "./DashboardFinancialComparisonChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
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

describe("DashboardFinancialComparisonChart", () => {
  it("renders actionable link when there are trips with pending expenses", () => {
    render(
      <MemoryRouter>
        <DashboardFinancialComparisonChart
          isLoading={false}
          financialMonth={buildFinancialMonth({ trips_with_pending_expenses: 2 })}
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", {
      name: "Ir a aprobaciones de gastos en cola",
    });
    expect(link).toHaveAttribute(
      "href",
      "/finance?tab=approvals&status=pending&type=trip_expense",
    );
  });

  it("does not render pending expenses alert when count is zero", () => {
    render(
      <MemoryRouter>
        <DashboardFinancialComparisonChart
          isLoading={false}
          financialMonth={buildFinancialMonth({ trips_with_pending_expenses: 0 })}
        />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("link", {
        name: "Ir a aprobaciones de gastos en cola",
      }),
    ).not.toBeInTheDocument();
  });
});
