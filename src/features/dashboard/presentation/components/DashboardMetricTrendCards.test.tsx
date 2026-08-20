import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { FinancialMonth } from "../../domain/types";
import { DashboardMetricTrendCards } from "./DashboardMetricTrendCards";
import { dashboardCopy } from "../copy/dashboardCopy";

function buildFinancialMonth(
  overrides: Partial<FinancialMonth> = {},
): FinancialMonth {
  return {
    trip_count: 2,
    budgeted_revenue: 100_000,
    actual_revenue: 90_000,
    budgeted_cost: 50_000,
    actual_cost: 40_000,
    budgeted_margin: 50_000,
    actual_margin: 50_000,
    revenue_variance: -10_000,
    cost_variance: -10_000,
    margin_variance: 0,
    trips_with_pending_expenses: 0,
    ...overrides,
  };
}

describe("DashboardMetricTrendCards", () => {
  it("labels the first cell as operational margin (PD-A)", () => {
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: { financial_month: buildFinancialMonth() },
            } as never
          }
          isLoading={false}
          navigate={navigate}
          financeLoading={false}
          financeSummary={{
            collectedThisMonth: 10_000,
            totalReceivable: 20_000,
            totalOverdue: 0,
          } as never}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(dashboardCopy.scorecard.margin.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.margin.subtitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.collected.title),
    ).toBeInTheDocument();
  });

  it("shows Provisional chip and navigates to approvals when pending (PD-B)", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  trips_with_pending_expenses: 1,
                }),
              },
            } as never
          }
          isLoading={false}
          navigate={navigate}
          financeLoading={false}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(dashboardCopy.scorecard.margin.provisionalChip),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.margin.provisionalHint),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.scorecard.margin.provisionalAriaLabel,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(
      "/finance?tab=approvals&status=pending&type=trip_expense",
    );
  });
});
