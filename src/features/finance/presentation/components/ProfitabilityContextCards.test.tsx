import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfitabilityContextCards } from "./ProfitabilityContextCards";

describe("ProfitabilityContextCards", () => {
  it("renders projected and cancellation aggregates", () => {
    render(
      <ProfitabilityContextCards
        aggregates={{
          totalRevenue: 4000,
          totalActual: 1000,
          blendedMargin: 3000,
          blendedMarginPct: 75,
          totalProjectedRevenue: 3000,
          totalCancellationLoss: 250,
          totalCancelledInvoiceRevenue: 5000,
          byProfitabilityStatus: {
            high: 1,
            medium: 0,
            low: 0,
            breakeven: 0,
            loss: 0,
          },
        }}
      />,
    );

    expect(
      screen.getByText("Fuera de operación · no incluido en el margen"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ingreso estimado")).toBeInTheDocument();
    expect(screen.getByText("Pérdida por cancelaciones")).toBeInTheDocument();
    expect(
      screen.getByText("Ingreso no reconocido (factura cancelada)"),
    ).toBeInTheDocument();
  });
});
