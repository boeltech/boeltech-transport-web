/**
 * Smoke — Finanzas › Análisis › Rendimiento: comparativa mensual e interanual (mock API).
 * Entrada por deep link `?view=performance`; KPIs y gráfica visibles sin clics extra.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FinanceAnalysisPage } from "@features/finance/presentation/pages/FinanceAnalysisPage";
import type { MonthlyPerformance, PeriodFinancials } from "@features/finance/domain";

const mockGetMonthlyPerformance = vi.fn();

vi.mock("@features/finance/infrastructure/financeApi", () => ({
  financeApi: {
    getMonthlyPerformance: (...args: unknown[]) => mockGetMonthlyPerformance(...args),
  },
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  ComposedChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => (
    <div data-testid="composed-chart" data-points={data.length}>
      {children}
    </div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => <span data-testid={`bar-${dataKey}`} />,
  Line: ({ dataKey }: { dataKey: string }) => <span data-testid={`line-${dataKey}`} />,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}));

function financials(
  period: string,
  revenue: number,
  cost: number,
  tripCount: number,
): PeriodFinancials {
  return {
    period,
    actualRevenue: revenue,
    actualCost: cost,
    actualMargin: revenue - cost,
    tripCount,
  };
}

function performanceWithPreviousYear(): MonthlyPerformance {
  return {
    periods: ["2026-08", "2026-09", "2026-10"],
    current: [
      financials("2026-08", 1000, 600, 2),
      financials("2026-09", 2000, 1000, 3),
      financials("2026-10", 500, 100, 1),
    ],
    previous: [
      financials("2025-08", 800, 500, 1),
      financials("2025-09", 1500, 900, 2),
      financials("2025-10", 0, 0, 0),
    ],
  };
}

function performanceWithoutPreviousYear(): MonthlyPerformance {
  const data = performanceWithPreviousYear();
  return {
    ...data,
    previous: data.previous.map((row) => financials(row.period, 0, 0, 0)),
  };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={["/finance/analysis?view=performance"]}>
      <QueryClientProvider client={queryClient}>
        <FinanceAnalysisPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("finance performance YoY smoke", () => {
  beforeEach(() => {
    mockGetMonthlyPerformance.mockReset();
  });

  it("opens Rendimiento from the deep link with KPIs, chart and table", async () => {
    mockGetMonthlyPerformance.mockResolvedValue(performanceWithPreviousYear());
    renderPage();

    expect(
      screen.getByRole("radio", { name: "Rendimiento", checked: true }),
    ).toBeInTheDocument();

    const kpis = screen.getByRole("region", { name: "Totales del rango" });
    expect(await within(kpis).findByText("$3,500.00")).toBeInTheDocument();
    expect(within(kpis).getByText("vs $2,300.00 año anterior")).toBeInTheDocument();

    expect(screen.getByText("Ingreso, gasto y margen mes a mes")).toBeInTheDocument();
    expect(screen.getAllByTestId("composed-chart")).toHaveLength(2);
    expect(screen.getAllByTestId("bar-previousRevenue")).toHaveLength(1);
    expect(screen.getByTestId("line-previousMarginPct")).toBeInTheDocument();
    expect(screen.getByText("Ingreso año anterior")).toBeInTheDocument();

    expect(screen.getByRole("switch", { name: "Comparar con año anterior" })).toBeChecked();
    expect(screen.getAllByText("oct 2026 (en curso)").length).toBeGreaterThan(0);
    expect(screen.getByRole("columnheader", { name: "Ingreso vs año ant." })).toBeInTheDocument();
    expect(mockGetMonthlyPerformance).toHaveBeenCalledWith(12);
  });

  it("toggles the previous-year comparison and changes the month window", async () => {
    const user = userEvent.setup();
    mockGetMonthlyPerformance.mockResolvedValue(performanceWithPreviousYear());
    renderPage();

    await screen.findByText("$3,500.00");
    const compare = screen.getByRole("switch", { name: "Comparar con año anterior" });

    await user.click(compare);

    expect(compare).not.toBeChecked();
    expect(screen.queryByTestId("bar-previousRevenue")).not.toBeInTheDocument();
    expect(screen.queryByText(/^vs .* año anterior$/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Ingreso vs año ant." }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "6 meses" }));
    expect(mockGetMonthlyPerformance).toHaveBeenCalledWith(6);
  });

  it("disables the comparison and explains why when there is no previous-year data", async () => {
    mockGetMonthlyPerformance.mockResolvedValue(performanceWithoutPreviousYear());
    renderPage();

    const notice = await screen.findByText(
      "Aún no hay datos de ago 2025 a oct 2025 para comparar.",
    );
    const compare = screen.getByRole("switch", { name: "Comparar con año anterior" });
    expect(compare).not.toBeChecked();
    expect(compare).toBeDisabled();
    expect(compare).toHaveAccessibleDescription(notice.textContent ?? "");

    const kpis = screen.getByRole("region", { name: "Totales del rango" });
    expect(await within(kpis).findByText("$3,500.00")).toBeInTheDocument();
    expect(screen.queryByText(/^vs .* año anterior$/)).not.toBeInTheDocument();
    expect(screen.queryByText("Nuevo")).not.toBeInTheDocument();

    expect(screen.queryByTestId("bar-previousRevenue")).not.toBeInTheDocument();
    expect(screen.queryByTestId("line-previousMarginPct")).not.toBeInTheDocument();
    expect(screen.queryByText("Ingreso año anterior")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Ingreso vs año ant." }),
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no completed trips in the range", async () => {
    mockGetMonthlyPerformance.mockResolvedValue({
      periods: ["2026-09", "2026-10"],
      current: [financials("2026-09", 0, 0, 0), financials("2026-10", 0, 0, 0)],
      previous: [financials("2025-09", 0, 0, 0), financials("2025-10", 0, 0, 0)],
    });
    renderPage();

    expect(
      await screen.findByText("Sin viajes completados en el rango"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("composed-chart")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar CSV/ })).toBeDisabled();
  });
});
