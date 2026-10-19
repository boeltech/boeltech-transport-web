import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { FinancialMonth, FinancialTrendData } from "../../domain/types";
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

function buildTrend(overrides: Partial<FinancialTrendData> = {}): FinancialTrendData {
  return {
    periods: ["2026-02", "2026-03"],
    budgeted_revenue: [100_000, 100_000],
    actual_revenue: [100_000, 120_000],
    budgeted_cost: [40_000, 40_000],
    actual_cost: [40_000, 40_000],
    currentPeriod: "2026-03",
    ...overrides,
  };
}

const financeSummaryStub = {
  collectedThisMonth: 10_000,
  totalReceivable: 20_000,
  totalOverdue: 0,
} as never;

describe("DashboardMetricTrendCards — Aurora cluster", () => {
  it("renders hero Margen + $/viaje footer and vertical AR stack", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: { financial_month: buildFinancialMonth() },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financeSummary={financeSummaryStub}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(dashboardCopy.scorecard.margin.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.revenuePerTrip.title),
    ).toBeInTheDocument();
    expect(screen.queryByText("Unidades con más gasto")).not.toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.collected.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.receivable.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.overdue.title),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(dashboardCopy.scorecard.arStrip.ariaLabel),
    ).toBeInTheDocument();
  });

  it("shows revenue-per-trip as its own card value (no Margen caption)", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  actual_revenue: 90_000,
                  trip_count: 2,
                }),
              },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("$45,000")).toBeInTheDocument();
    expect(
      screen.queryByText(
        dashboardCopy.scorecard.revenuePerTrip.caption("$45,000"),
      ),
    ).not.toBeInTheDocument();
  });

  it("shows em dash for revenue/trip when trip_count is 0", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  actual_revenue: 90_000,
                  trip_count: 0,
                }),
              },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
        />
      </MemoryRouter>,
    );

    const revenueCard = screen.getByLabelText(
      dashboardCopy.scorecard.revenuePerTrip.ariaLabel,
    );
    expect(revenueCard).toHaveTextContent("—");
  });

  it("ADR-0096: Cobrado subtitle excludes operational cash", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: { financial_month: buildFinancialMonth() },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financeSummary={financeSummaryStub}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Cobrado")).toBeInTheDocument();
    expect(
      screen.getByText(/Pagos de facturas · sin efectivo sin CFDI/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Pagos registrados en el periodo"),
    ).not.toBeInTheDocument();
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
      "/finance/approvals?status=pending&type=trip_expense",
      { state: { from: "/dashboard" } },
    );
  });

  it("uses text-card-foreground on card amounts (not solid *-foreground on bg-card)", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  actual_margin: 412_780,
                }),
              },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financeSummary={financeSummaryStub}
        />
      </MemoryRouter>,
    );

    const amount = screen.getByText(/412/);
    expect(amount.className).toContain("text-card-foreground");
    expect(amount.className).not.toContain("text-warning-foreground");
    expect(amount.className).not.toContain("text-success-foreground");
  });

  it("hides sparkline on xs and caps width on sm+ (F5 responsive)", () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: { financial_month: buildFinancialMonth() },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financeSummary={financeSummaryStub}
          financialTrend={buildTrend()}
        />
      </MemoryRouter>,
    );

    const spark = container.querySelector('[data-testid="margin-sparkline"]');
    expect(spark).not.toBeNull();
    expect(spark?.className).toContain("hidden");
    expect(spark?.className).toContain("sm:block");
    expect(spark?.className).toContain("w-20");
    expect(spark?.className).toContain("md:w-[120px]");
  });

  it("keeps focus-visible ring on clickable AR cards", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: { financial_month: buildFinancialMonth() },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financeSummary={financeSummaryStub}
        />
      </MemoryRouter>,
    );

    const arCard = screen.getByRole("button", {
      name: dashboardCopy.scorecard.collected.ariaLabel,
    });
    expect(arCard.className).toContain("focus-visible:ring-2");
    expect(arCard.className).toContain("focus-visible:ring-ring");
  });

  it("uses text-warning (not warning-foreground) for provisional margin amount", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  actual_margin: 338_510,
                  trips_with_pending_expenses: 1,
                }),
              },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
        />
      </MemoryRouter>,
    );

    const amount = screen.getByText(/338/);
    expect(amount.className).toContain("text-warning");
    expect(amount.className).not.toContain("text-warning-foreground");

    const hint = screen.getByText(
      dashboardCopy.scorecard.margin.provisionalHint,
    );
    expect(hint.className).toContain("text-warning");
    expect(hint.className).not.toContain("text-warning-foreground");
  });

  it("uses text-warning for overdue amount when balance is past due", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: { financial_month: buildFinancialMonth() },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financeSummary={
            {
              collectedThisMonth: 0,
              totalReceivable: 0,
              totalOverdue: 12_500,
            } as never
          }
        />
      </MemoryRouter>,
    );

    const overdueAmount = screen.getByText(/12/);
    expect(overdueAmount.className).toContain("text-warning");
    expect(overdueAmount.className).not.toContain("text-warning-foreground");
  });

  it("shows MoM delta for Margen when financial-trend has ≥2 periods (F2)", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: { financial_month: buildFinancialMonth() },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financeSummary={financeSummaryStub}
          financialTrend={buildTrend()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("+33.3%")).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.vsPreviousMonth),
    ).toBeInTheDocument();
    // Solo Margen lleva Δ%; $/viaje y AR no inventan deltas
    expect(
      screen.getAllByText(dashboardCopy.scorecard.vsPreviousMonth),
    ).toHaveLength(1);
  });

  it("omits delta and sparkline when trend has fewer than 2 periods (graceful degrade)", () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: { financial_month: buildFinancialMonth() },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financialTrend={buildTrend({
            periods: ["2026-03"],
            budgeted_revenue: [100_000],
            actual_revenue: [100_000],
            budgeted_cost: [40_000],
            actual_cost: [40_000],
          })}
        />
      </MemoryRouter>,
    );

    expect(
      screen.queryByText(dashboardCopy.scorecard.vsPreviousMonth),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[aria-hidden] .recharts-responsive-container"),
    ).toBeNull();
  });

  it("keeps Provisional chip when margin is enriched (F2)", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  trips_with_pending_expenses: 2,
                }),
              },
            } as never
          }
          isLoading={false}
          navigate={vi.fn()}
          financeLoading={false}
          financialTrend={buildTrend()}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(dashboardCopy.scorecard.margin.provisionalChip),
    ).toBeInTheDocument();
    expect(screen.getByText("+33.3%")).toBeInTheDocument();
  });

  it("deep-links AR strip cells to Cobros", async () => {
    const user = userEvent.setup();
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
          financeSummary={
            {
              collectedThisMonth: 10_000,
              totalReceivable: 20_000,
              totalOverdue: 5_000,
            } as never
          }
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.scorecard.receivable.ariaLabel,
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/finance/cobros", {
      state: { from: "/dashboard" },
    });

    navigate.mockClear();
    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.scorecard.overdue.ariaLabel,
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/finance/cobros", {
      state: { from: "/dashboard" },
    });

    navigate.mockClear();
    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.scorecard.collected.ariaLabel,
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/finance/cobros", {
      state: { from: "/dashboard" },
    });
  });

});
