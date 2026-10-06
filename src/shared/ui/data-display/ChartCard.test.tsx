import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartCard } from "./ChartCard";

/**
 * jsdom no calcula layout: se fija el contrato de clases que evita el desborde
 * a 375 px (título a ancho completo, herramientas debajo y envolviendo).
 */
describe("ChartCard header", () => {
  function renderCard() {
    render(
      <ChartCard
        title="Ingresos, costos y margen"
        isLoading={false}
        tools={<button type="button">12m</button>}
      >
        <div />
      </ChartCard>,
    );
    const tools = screen.getByRole("button", { name: "12m" }).parentElement!;
    const header = tools.parentElement!;
    const titleBlock = screen.getByText("Ingresos, costos y margen").parentElement!;
    return { tools, header, titleBlock };
  }

  it("stacks title and tools on mobile and keeps one row from sm up", () => {
    const { header } = renderCard();
    expect(header).toHaveClass("flex-col", "sm:flex-row", "sm:justify-between");
    expect(header).not.toHaveClass("flex-row");
  });

  it("lets the tools wrap inside the card instead of overflowing", () => {
    const { tools, titleBlock } = renderCard();
    expect(tools).toHaveAttribute("data-slot", "chart-card-tools");
    expect(tools).toHaveClass("flex-wrap", "max-w-full", "min-w-0", "sm:shrink-0");
    expect(tools).not.toHaveClass("shrink-0");
    expect(titleBlock).toHaveClass("min-w-0");
  });
});
