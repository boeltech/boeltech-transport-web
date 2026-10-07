import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  alignPerformanceMonths,
  type AlignedPerformanceMonth,
} from "@features/finance/application";
import { PerformanceMonthlyTable } from "./PerformanceMonthlyTable";

const months: AlignedPerformanceMonth[] = alignPerformanceMonths({
  periods: ["2026-09", "2026-10"],
  current: [
    { period: "2026-09", actualRevenue: 1000, actualCost: 400, actualMargin: 600, tripCount: 2 },
    { period: "2026-10", actualRevenue: 500, actualCost: 100, actualMargin: 400, tripCount: 1 },
  ],
  previous: [
    { period: "2025-09", actualRevenue: 800, actualCost: 400, actualMargin: 400, tripCount: 1 },
    { period: "2025-10", actualRevenue: 900, actualCost: 300, actualMargin: 600, tripCount: 3 },
  ],
});

function renderTable(compare: boolean) {
  return render(
    <MemoryRouter>
      <PerformanceMonthlyTable months={months} compare={compare} />
    </MemoryRouter>,
  );
}

describe("PerformanceMonthlyTable", () => {
  it("merges the three variation cells of the month in progress", () => {
    renderTable(true);
    const inProgressRow = screen.getByRole("row", { name: /oct 2026 \(en curso\)/ });
    const merged = within(inProgressRow).getByText("Se compara cuando termine el mes");
    expect(merged.closest("td")).toHaveAttribute("colspan", "3");
    expect(within(inProgressRow).queryByText("—")).not.toBeInTheDocument();
    expect(within(inProgressRow).queryByText("Nuevo")).not.toBeInTheDocument();
    expect(inProgressRow.textContent).not.toMatch(/[+−]\d/);
  });

  it("still compares complete months", () => {
    renderTable(true);
    const septemberRow = screen.getByRole("row", { name: /sep 2026/ });
    expect(within(septemberRow).getByLabelText("subió +25.0%")).toBeInTheDocument();
  });

  it("each month opens Rentabilidad with that month as the period", () => {
    renderTable(false);
    expect(screen.getByRole("link", { name: "Ver rentabilidad de sep 2026" })).toHaveAttribute(
      "href",
      "/finance/analysis?view=margin&from=2026-09-01&to=2026-09-30",
    );
    expect(
      screen.getByRole("link", { name: "Ver rentabilidad de oct 2026 (en curso)" }),
    ).toHaveAttribute(
      "href",
      "/finance/analysis?view=margin&from=2026-10-01&to=2026-10-31",
    );
  });

  it("has no comparison cells without comparison", () => {
    renderTable(false);
    expect(screen.queryByText("Se compara cuando termine el mes")).not.toBeInTheDocument();
  });
});
