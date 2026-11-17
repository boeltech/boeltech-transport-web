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

describe("DashboardMetricTrendCards — Resumen del mes v2 (F5)", () => {
  it("renders zone title, Margen + Cobranza and formula terms", () => {
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

    expect(screen.getByText(dashboardCopy.scorecard.title)).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.margin.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.cobranza.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.margin.formula.revenue),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.scorecard.margin.formula.costs),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(dashboardCopy.scorecard.revenuePerTrip.title),
    ).not.toBeInTheDocument();
  });

  it("puts trips + avg revenue in Margen footer (no dedicated $/viaje strip)", () => {
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

    expect(
      screen.getByText(/2 viajes completados · \$45,000 de ingreso promedio/),
    ).toBeInTheDocument();
  });

  it("shows closed-fallback comparison without % when period_to_date is absent", () => {
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

    expect(screen.getByText(/Febrero cerró en/)).toBeInTheDocument();
    expect(screen.queryByText("+33.3%")).not.toBeInTheDocument();
    expect(
      screen.queryByText(dashboardCopy.scorecard.vsPreviousMonth),
    ).not.toBeInTheDocument();
  });

  it("shows period MoM % only when period_to_date is present", () => {
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
          financialTrend={buildTrend({
            periodToDate: {
              day: 17,
              current: {
                from: "2026-03-01",
                to: "2026-03-17",
                actual_revenue: 80_000,
                actual_cost: 20_000,
                actual_margin: 60_000,
                trip_count: 2,
              },
              previous: {
                from: "2026-02-01",
                to: "2026-02-17",
                actual_revenue: 70_000,
                actual_cost: 20_000,
                actual_margin: 50_000,
                trip_count: 2,
              },
            },
          })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("+20%")).toBeInTheDocument();
    expect(screen.getByText(/vs 1–17 feb/)).toBeInTheDocument();
  });

  it("renders 6 trend bars when trend has ≥2 periods", () => {
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
          financialTrend={buildTrend()}
        />
      </MemoryRouter>,
    );

    expect(
      container.querySelector('[data-testid="margin-trend-bars"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="margin-sparkline"]'),
    ).toBeNull();
  });

  it("shows Provisional + pending copy without $X when amount is absent", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  trips_with_pending_expenses: 3,
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

    expect(
      screen.getByText(dashboardCopy.scorecard.margin.provisionalChip),
    ).toBeInTheDocument();
    expect(screen.getByText("3 gastos sin aprobar")).toBeInTheDocument();
    expect(
      screen.getByText(/El margen puede bajar: hay 3 gastos/),
    ).toBeInTheDocument();
    expect(screen.getByText("Revisar")).toBeInTheDocument();
  });

  it("includes pending $X when F5a amount is present", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  pending_expenses_count: 3,
                  pending_expenses_amount: 8_450,
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

    expect(
      screen.getByText("3 gastos sin aprobar · $8,450"),
    ).toBeInTheDocument();
  });

  it("navigates Revisar to approvals and Ver en Análisis to margin", async () => {
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

    await user.click(screen.getByText("Revisar"));
    expect(navigate).toHaveBeenCalledWith(
      "/finance/approvals?status=pending&type=trip_expense",
      { state: { from: "/dashboard" } },
    );

    navigate.mockClear();
    await user.click(
      screen.getByText(dashboardCopy.scorecard.margin.openAnalysis),
    );
    expect(navigate).toHaveBeenCalledWith(
      expect.stringContaining("/finance/analysis"),
      { state: { from: "/dashboard" } },
    );
  });

  it("shows Nada vencido in green when overdue is 0", () => {
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

    const ok = screen.getByText(
      dashboardCopy.scorecard.cobranza.nothingOverdue,
    );
    expect(ok).toBeInTheDocument();
    expect(ok.className).toContain("text-success");
  });

  it("shows empty month copy without inventing MoM %", () => {
    render(
      <MemoryRouter>
        <DashboardMetricTrendCards
          data={
            {
              stats: {
                financial_month: buildFinancialMonth({
                  trip_count: 0,
                  actual_revenue: 0,
                  actual_cost: 0,
                  actual_margin: 0,
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
      screen.getByText(/Aún no hay viajes completados/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Febrero cerró en/)).toBeInTheDocument();
    expect(screen.queryByText("+33.3%")).not.toBeInTheDocument();
  });

  it("deep-links Cobranza rows and Ver Cartera to hub", async () => {
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
        name: dashboardCopy.scorecard.cobranza.receivableAria,
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/finance", {
      state: { from: "/dashboard" },
    });

    navigate.mockClear();
    await user.click(
      screen.getByText(dashboardCopy.scorecard.cobranza.openCartera),
    );
    expect(navigate).toHaveBeenCalledWith("/finance", {
      state: { from: "/dashboard" },
    });
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
  });

  it("keeps lg 7/5 and items-start (no stretch)", () => {
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
        />
      </MemoryRouter>,
    );

    const grid = container.querySelector(".lg\\:grid-cols-12");
    expect(grid?.className).toContain("lg:items-start");
    expect(grid?.className).not.toContain("items-stretch");
    expect(container.querySelector(".lg\\:col-span-7")).not.toBeNull();
    expect(container.querySelector(".lg\\:col-span-5")).not.toBeNull();
  });
});
