import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ProfitabilityAggregateItem } from "@features/finance/domain";
import { ProfitabilityKpiCards } from "./ProfitabilityKpiCards";

vi.mock("@shared/ui/data-display", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/ui/data-display")>()),
  Sparkline: ({ data }: { data: Array<{ value: number }> }) => (
    <div
      data-testid="revenue-sparkline"
      data-values={data.map((point) => point.value).join(",")}
    />
  ),
}));

const baseTrips = {
  data: [],
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
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

function monthRow(key: string, totalRevenue: number): ProfitabilityAggregateItem {
  return {
    key,
    label: key,
    tripCount: 1,
    totalRevenue,
    totalActual: 0,
    blendedMargin: totalRevenue,
    blendedMarginPct: 100,
  };
}

describe("ProfitabilityKpiCards", () => {
  it("shows margin cards for operational scope", () => {
    render(
      <ProfitabilityKpiCards scope="operational" trips={baseTrips} />,
    );
    expect(screen.getByText("Ingreso")).toBeInTheDocument();
    expect(screen.getAllByText(/^Margen$/).length).toBeGreaterThan(0);
  });

  it("shows projected revenue without margin for pipeline scope", () => {
    render(<ProfitabilityKpiCards scope="pipeline" trips={baseTrips} />);
    expect(screen.getByText("Ingreso estimado")).toBeInTheDocument();
    expect(screen.queryByText(/^Margen$/)).not.toBeInTheDocument();
  });

  it("shows cancellation loss for cancelled scope", () => {
    render(<ProfitabilityKpiCards scope="cancelled" trips={baseTrips} />);
    expect(screen.getByText("Pérdida por cancelación")).toBeInTheDocument();
    expect(screen.queryByText(/^Margen$/)).not.toBeInTheDocument();
  });

  it.each(["operational", "pipeline", "cancelled"] as const)(
    "says the figures cover all history (%s scope)",
    (scope) => {
      render(<ProfitabilityKpiCards scope={scope} trips={baseTrips} />);
      expect(screen.getByText("Periodo: todo el histórico")).toBeInTheDocument();
    },
  );

  it("draws the revenue sparkline in chronological order even if the API sorts by revenue", () => {
    render(
      <ProfitabilityKpiCards
        scope="operational"
        trips={baseTrips}
        monthAggregate={[
          monthRow("2026-01", 100),
          monthRow("2026-03", 200),
          monthRow("2025-12", 300),
          monthRow("2026-02", 400),
        ]}
      />,
    );
    expect(screen.getByTestId("revenue-sparkline")).toHaveAttribute(
      "data-values",
      "300,100,400,200",
    );
  });
});
