import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { AlignedPerformanceMonth } from "@features/finance/application";
import { PerformanceTooltipContent } from "./PerformanceTooltipContent";

function month(overrides: Partial<AlignedPerformanceMonth> = {}): AlignedPerformanceMonth {
  return {
    period: "2026-01",
    isInProgress: false,
    current: {
      period: "2026-01",
      actualRevenue: 1000,
      actualCost: 600,
      actualMargin: 400,
      tripCount: 2,
    },
    previous: {
      period: "2025-01",
      actualRevenue: 800,
      actualCost: 500,
      actualMargin: 300,
      tripCount: 1,
    },
    ...overrides,
  };
}

describe("PerformanceTooltipContent", () => {
  it("shows current vs same month last year with Δ$ and Δ%", () => {
    render(<PerformanceTooltipContent month={month()} compare />);

    expect(screen.getByText("ene 2026")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "2026" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "2025" })).toBeInTheDocument();

    const revenueRow = screen.getByRole("row", { name: /Ingreso/ });
    expect(within(revenueRow).getByText("$1,000.00")).toBeInTheDocument();
    expect(within(revenueRow).getByText("$800.00")).toBeInTheDocument();
    expect(within(revenueRow).getByText("+$200.00 (+25.0%)")).toBeInTheDocument();

    const costRow = screen.getByRole("row", { name: /^Gasto/ });
    expect(within(costRow).getByText("+$100.00 (+20.0%)")).toBeInTheDocument();
  });

  it("avoids Infinity when last year is zero for a complete month", () => {
    const { container } = render(
      <PerformanceTooltipContent
        compare
        month={month({
          previous: {
            period: "2025-01",
            actualRevenue: 0,
            actualCost: 0,
            actualMargin: 0,
            tripCount: 0,
          },
        })}
      />,
    );

    expect(screen.getAllByText("+$1,000.00 (Nuevo)")).toHaveLength(1);
    expect(container.textContent).not.toMatch(/Infinity|NaN/);
  });

  it("shows only the current year for the in-progress month, with a note instead of a comparison", () => {
    const { container } = render(
      <PerformanceTooltipContent
        compare
        month={month({
          period: "2026-10",
          isInProgress: true,
          current: {
            period: "2026-10",
            actualRevenue: 500,
            actualCost: 100,
            actualMargin: 400,
            tripCount: 1,
          },
          previous: {
            period: "2025-10",
            actualRevenue: 900,
            actualCost: 300,
            actualMargin: 600,
            tripCount: 3,
          },
        })}
      />,
    );

    expect(screen.getByText("oct 2026 (en curso)")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
    expect(screen.queryByText("$900.00")).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Diferencia|−\$|\+\$|%\)/);
    expect(
      screen.getByText("Se compara con oct 2025 cuando termine el mes."),
    ).toBeInTheDocument();
  });

  it("does not add the in-progress note when comparison is off", () => {
    render(
      <PerformanceTooltipContent
        compare={false}
        month={month({ period: "2026-10", isInProgress: true })}
      />,
    );
    expect(screen.queryByText(/cuando termine el mes/)).not.toBeInTheDocument();
  });

  it("omits previous-year columns without comparison", () => {
    render(<PerformanceTooltipContent month={month()} compare={false} />);

    expect(screen.queryByText("$800.00")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader")).not.toBeInTheDocument();
  });
});
