/**
 * Smoke — Análisis › Rentabilidad (ADR-0050 alcance + F1 consolidación, mock API):
 * periodo de 12 meses completos por defecto, sin gráfica mensual, tabla por Margen $,
 * tarjeta «Viajes con pérdida» que solo filtra los viajes de un grupo abierto.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock(
  "@features/finance/presentation/components/ProfitabilityMasterDetailTable",
  () => ({
    ProfitabilityMasterDetailTable: (props: {
      lossOnly?: boolean;
      from?: string;
      to?: string;
    }) => (
      <div
        data-testid="profitability-table-stub"
        data-loss-only={String(Boolean(props.lossOnly))}
        data-from={props.from}
        data-to={props.to}
      />
    ),
  }),
);

function operationalResponse(loss = 7): ProfitabilityTripsResponse {
  return {
    data: [],
    pagination: { page: 1, limit: 100, total: 120, totalPages: 2 },
    aggregates: {
      totalRevenue: 4000,
      totalActual: 1000,
      blendedMargin: 3000,
      blendedMarginPct: 75,
      totalProjectedRevenue: 3000,
      totalCancellationLoss: 250,
      totalCancelledInvoiceRevenue: 0,
      byProfitabilityStatus: {
        high: 100,
        medium: 10,
        low: 3,
        breakeven: 0,
        loss,
      },
    },
  };
}

function renderTab(path = "/finance/analysis?view=margin") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <ProfitabilityTab />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

type TripsCall = {
  scope?: string;
  from?: string;
  to?: string;
  profitabilityStatus?: string[];
};
type AggregateCall = TripsCall & { dimension?: string; sortBy?: string; sortOrder?: string };

describe("profitability scope smoke", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-06T18:00:00Z"));
    mockGetProfitabilityTrips.mockReset();
    mockGetProfitabilityAggregate.mockReset();
    mockGetProfitabilityAggregate.mockResolvedValue([]);
    mockGetProfitabilityTrips.mockResolvedValue(operationalResponse());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults to the last 12 complete months with the period next to the KPIs", async () => {
    renderTab();

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Alcance" })).toBeInTheDocument();
      expect(screen.getByText("Ingreso")).toBeInTheDocument();
      // TD6: monto primario + % en subtitle (no «$ · %» en un solo nodo)
      expect(screen.getByText("$3,000.00")).toBeInTheDocument();
      expect(screen.getByText("75.00% del ingreso")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Periodo: oct 2025 a sep 2026 · 12 meses completos"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Periodo" })).toHaveTextContent(
      "Últimos 12 meses",
    );
    expect(screen.queryByText(/todo el histórico/i)).not.toBeInTheDocument();

    const tripsCalls = mockGetProfitabilityTrips.mock.calls.map(
      (call) => call[0] as TripsCall,
    );
    expect(tripsCalls).toContainEqual(
      expect.objectContaining({
        scope: "operational",
        from: "2025-10-01",
        to: "2026-09-30",
      }),
    );
    expect(tripsCalls.map((call) => call.scope)).not.toContain("all");
    expect(tripsCalls.map((call) => call.scope)).not.toContain("with_in_progress");
  });

  it("has no monthly chart, sparkline nor «Mes» grouping, and sorts groups by margin $", async () => {
    renderTab();
    await screen.findByTestId("profitability-table-stub");

    expect(screen.queryByText("Ingreso vs gasto real por mes")).not.toBeInTheDocument();
    expect(screen.queryByTestId("profitability-charts-stub")).not.toBeInTheDocument();

    await waitFor(() => expect(mockGetProfitabilityAggregate).toHaveBeenCalled());
    const aggregateCalls = mockGetProfitabilityAggregate.mock.calls.map(
      (call) => call[0] as AggregateCall,
    );
    expect(aggregateCalls.map((call) => call.dimension)).not.toContain("month");
    expect(aggregateCalls).toContainEqual(
      expect.objectContaining({
        dimension: "client",
        sortBy: "blendedMargin",
        sortOrder: "desc",
        from: "2025-10-01",
        to: "2026-09-30",
      }),
    );
  });

  it("offers the grouped table as the default CSV and the trip sample with its limit", async () => {
    const user = userEvent.setup();
    mockGetProfitabilityAggregate.mockResolvedValue([
      {
        key: "c1",
        label: "ACME",
        tripCount: 3,
        totalRevenue: 3000,
        totalActual: 1000,
        blendedMargin: 2000,
        blendedMarginPct: 66.67,
      },
    ]);
    renderTab();

    const trigger = await screen.findByRole("button", { name: /Exportar CSV/ });
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(screen.queryByRole("button", { name: /Exportar muestra/i })).not.toBeInTheDocument();

    await user.click(trigger);
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Tabla por cliente del periodo",
      "Muestra de viajes (máx. 100)",
    ]);
  });

  it("the loss card only filters the trips of an opened group, not the totals", async () => {
    const user = userEvent.setup();
    renderTab();

    expect(await screen.findByText("7 de 120")).toBeInTheDocument();
    const table = screen.getByTestId("profitability-table-stub");
    expect(table).toHaveAttribute("data-loss-only", "false");

    await user.click(
      screen.getByRole("button", { name: "Ver solo estos al abrir un grupo" }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("profitability-table-stub")).toHaveAttribute(
        "data-loss-only",
        "true",
      ),
    );
    expect(screen.getByText(/Los totales no cambian/)).toBeInTheDocument();
    expect(screen.getByText("Viajes del grupo: solo con pérdida")).toBeInTheDocument();
    const tripsCalls = mockGetProfitabilityTrips.mock.calls.map(
      (call) => call[0] as TripsCall,
    );
    expect(tripsCalls.every((call) => call.profitabilityStatus == null)).toBe(true);
  });

  it("opens a single month from «Cifras por mes» as the period (D5)", async () => {
    renderTab("/finance/analysis?view=margin&from=2026-09-01&to=2026-09-30");

    expect(
      await screen.findByText("Periodo: sep 2026 · 1 mes completo"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Periodo" })).toHaveTextContent(
      "Personalizado",
    );
    expect(screen.getByTestId("profitability-table-stub")).toHaveAttribute(
      "data-from",
      "2026-09-01",
    );
    await waitFor(() =>
      expect(mockGetProfitabilityTrips).toHaveBeenCalledWith(
        expect.objectContaining({ from: "2026-09-01", to: "2026-09-30" }),
      ),
    );
  });
});
