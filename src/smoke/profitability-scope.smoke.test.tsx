/**
 * Smoke — ADR-0050 Fase 3: scope en Rentabilidad / Análisis › Margen (mock API).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfitabilityTab } from "@features/finance/presentation/pages/ProfitabilityTab";
import type { ProfitabilityTripsResponse } from "@features/finance/domain";

const mockGetProfitabilityTrips = vi.fn();
const mockGetProfitabilityAggregate = vi.fn();

vi.mock("@features/finance/infrastructure/financeApi", () => ({
  financeApi: {
    getProfitabilityTrips: (...args: unknown[]) =>
      mockGetProfitabilityTrips(...args),
    getProfitabilityAggregate: (...args: unknown[]) =>
      mockGetProfitabilityAggregate(...args),
  },
}));

vi.mock("@features/finance/presentation/components/ProfitabilityCharts", () => ({
  ProfitabilityCharts: () => <div data-testid="profitability-charts-stub" />,
}));

vi.mock(
  "@features/finance/presentation/components/ProfitabilityMasterDetailTable",
  () => ({
    ProfitabilityMasterDetailTable: () => (
      <div data-testid="profitability-table-stub" />
    ),
  }),
);

function operationalResponse(): ProfitabilityTripsResponse {
  return {
    data: [],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    aggregates: {
      totalRevenue: 4000,
      totalActual: 1000,
      blendedMargin: 3000,
      blendedMarginPct: 75,
      totalProjectedRevenue: 3000,
      totalCancellationLoss: 250,
      totalCancelledInvoiceRevenue: 0,
      byProfitabilityStatus: {
        high: 1,
        medium: 0,
        low: 0,
        breakeven: 0,
        loss: 0,
      },
    },
  };
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={["/finance?tab=analysis&view=margin"]}>
      <QueryClientProvider client={queryClient}>
        <ProfitabilityTab queriesEnabled />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("profitability scope smoke", () => {
  beforeEach(() => {
    mockGetProfitabilityTrips.mockReset();
    mockGetProfitabilityAggregate.mockReset();
    mockGetProfitabilityAggregate.mockResolvedValue([]);
    mockGetProfitabilityTrips.mockResolvedValue(operationalResponse());
  });

  it("renders scope toolbar, operational KPIs and export without redundant context blocks", async () => {
    renderTab();

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Alcance" })).toBeInTheDocument();
      expect(screen.getByText("Ingreso")).toBeInTheDocument();
      expect(screen.getByText("Margen")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Exportar margen/i })).toBeInTheDocument();
    expect(screen.queryByText("Composición financiera")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Fuera de operación · no incluido en el margen"),
    ).not.toBeInTheDocument();

    const scopeCalls = mockGetProfitabilityTrips.mock.calls.map(
      (call) => (call[0] as { scope?: string }).scope,
    );
    expect(scopeCalls).toContain("operational");
    expect(scopeCalls).not.toContain("all");
    expect(scopeCalls).not.toContain("with_in_progress");
  });
});
