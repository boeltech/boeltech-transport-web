import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfitabilityKpiCards } from "./ProfitabilityKpiCards";

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

describe("ProfitabilityKpiCards", () => {
  it("shows margin cards for operational scope", () => {
    render(
      <ProfitabilityKpiCards scope="operational" trips={baseTrips} />,
    );
    expect(screen.getByText("Ingreso reconocido")).toBeInTheDocument();
    expect(screen.getByText("Margen blended")).toBeInTheDocument();
  });

  it("shows projected revenue without margin for pipeline scope", () => {
    render(<ProfitabilityKpiCards scope="pipeline" trips={baseTrips} />);
    expect(screen.getByText("Ingreso proyectado")).toBeInTheDocument();
    expect(screen.queryByText("Margen blended")).not.toBeInTheDocument();
  });

  it("shows cancellation loss for cancelled scope", () => {
    render(<ProfitabilityKpiCards scope="cancelled" trips={baseTrips} />);
    expect(screen.getByText("Pérdida por cancelación")).toBeInTheDocument();
    expect(screen.queryByText("Margen blended")).not.toBeInTheDocument();
  });
});
