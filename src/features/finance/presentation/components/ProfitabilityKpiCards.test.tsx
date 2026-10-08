import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ProfitabilityTripsResponse } from "@features/finance/domain";
import { ProfitabilityKpiCards } from "./ProfitabilityKpiCards";

function buildTrips(loss = 0, total = 120): ProfitabilityTripsResponse {
  return {
    data: [],
    pagination: { page: 1, limit: 100, total, totalPages: 2 },
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
        loss,
      },
    },
  };
}

describe("ProfitabilityKpiCards", () => {
  it("shows revenue, actual cost, margin $·% and the loss card for operational scope", () => {
    render(<ProfitabilityKpiCards scope="operational" trips={buildTrips(7)} />);
    expect(screen.getByText("Ingreso")).toBeInTheDocument();
    expect(screen.getByText("Gasto real")).toBeInTheDocument();
    expect(screen.getByText("$3,000.00 · 75.00%")).toBeInTheDocument();
    const lossCard = screen.getByTestId("profitability-loss-card");
    expect(within(lossCard).getByText("Viajes con pérdida")).toBeInTheDocument();
    expect(within(lossCard).getByText("7 de 120")).toBeInTheDocument();
  });

  it("no longer shows the «todo el histórico» caption or a sparkline", () => {
    render(<ProfitabilityKpiCards scope="operational" trips={buildTrips()} />);
    expect(screen.queryByText(/todo el histórico/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Top 20/)).not.toBeInTheDocument();
  });

  it("toggles the loss filter and says it only filters the trips of an opened group", async () => {
    const user = userEvent.setup();
    const onLossOnlyChange = vi.fn();
    const { rerender } = render(
      <ProfitabilityKpiCards
        scope="operational"
        trips={buildTrips(7)}
        onLossOnlyChange={onLossOnlyChange}
      />,
    );
    const apply = screen.getByRole("button", {
      name: "Ver solo estos al abrir un grupo",
    });
    expect(apply).toHaveAttribute("aria-pressed", "false");
    await user.click(apply);
    expect(onLossOnlyChange).toHaveBeenCalledWith(true);

    rerender(
      <ProfitabilityKpiCards
        scope="operational"
        trips={buildTrips(7)}
        lossOnly
        onLossOnlyChange={onLossOnlyChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Quitar filtro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText(/solo ves sus viajes con pérdida\. Los totales no cambian/),
    ).toBeInTheDocument();
  });

  it("hides the loss filter and says so when there are no loss trips", () => {
    render(
      <ProfitabilityKpiCards
        scope="operational"
        trips={buildTrips(0)}
        onLossOnlyChange={vi.fn()}
      />,
    );
    const lossCard = screen.getByTestId("profitability-loss-card");
    expect(within(lossCard).getByText("0 de 120")).toBeInTheDocument();
    expect(
      within(lossCard).getByText("Ningún viaje con pérdida en este periodo."),
    ).toBeInTheDocument();
    expect(within(lossCard).queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps «Quitar filtro» when the filter is active and the period has no loss trips", () => {
    render(
      <ProfitabilityKpiCards
        scope="operational"
        trips={buildTrips(0)}
        lossOnly
        onLossOnlyChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Quitar filtro" })).toBeEnabled();
  });

  it("shows projected revenue without margin nor loss card for pipeline scope", () => {
    render(<ProfitabilityKpiCards scope="pipeline" trips={buildTrips()} />);
    expect(screen.getByText("Ingreso estimado")).toBeInTheDocument();
    expect(screen.queryByText(/^Margen$/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("profitability-loss-card")).not.toBeInTheDocument();
  });

  it("shows cancellation loss for cancelled scope", () => {
    render(<ProfitabilityKpiCards scope="cancelled" trips={buildTrips()} />);
    expect(screen.getByText("Pérdida por cancelación")).toBeInTheDocument();
    expect(screen.queryByText(/^Margen$/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("profitability-loss-card")).not.toBeInTheDocument();
  });
});
