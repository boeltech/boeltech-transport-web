import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  alignPerformanceMonths,
  type AlignedPerformanceMonth,
} from "@features/finance/application";
import type { PeriodFinancials } from "@features/finance/domain";
import { TooltipProvider } from "@shared/ui/tooltip";
import { financeCopy } from "../copy";
import { PerformanceMonthlyTable } from "./PerformanceMonthlyTable";

function financials(
  period: string,
  revenue: number,
  cost: number,
  tripCount: number,
  provisional: Partial<
    Pick<
      PeriodFinancials,
      "incompleteTripCount" | "tripsWithPendingExpenses" | "provisional"
    >
  > = {},
): PeriodFinancials {
  return {
    period,
    actualRevenue: revenue,
    actualCost: cost,
    actualMargin: revenue - cost,
    tripCount,
    incompleteTripCount: provisional.incompleteTripCount ?? 0,
    tripsWithPendingExpenses: provisional.tripsWithPendingExpenses ?? 0,
    provisional: provisional.provisional ?? false,
  };
}

const months: AlignedPerformanceMonth[] = alignPerformanceMonths({
  periods: ["2026-09", "2026-10"],
  current: [
    financials("2026-09", 1000, 400, 2),
    financials("2026-10", 500, 100, 1),
  ],
  previous: [
    financials("2025-09", 800, 400, 1),
    financials("2025-10", 900, 300, 3),
  ],
});

const provisionalMonths: AlignedPerformanceMonth[] = alignPerformanceMonths({
  periods: ["2026-09", "2026-10"],
  current: [
    financials("2026-09", 1000, 400, 2, {
      incompleteTripCount: 2,
      tripsWithPendingExpenses: 1,
      provisional: true,
    }),
    financials("2026-10", 500, 100, 1, {
      incompleteTripCount: 3,
      tripsWithPendingExpenses: 2,
      provisional: true,
    }),
  ],
  previous: [
    financials("2025-09", 800, 400, 1),
    financials("2025-10", 900, 300, 3),
  ],
});

function renderTable(
  compare: boolean,
  rows: AlignedPerformanceMonth[] = months,
) {
  return render(
    <MemoryRouter>
      <TooltipProvider delayDuration={0}>
        <PerformanceMonthlyTable months={rows} compare={compare} />
      </TooltipProvider>
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

  it("shows Provisional chip on closed provisional months with DOM tooltip and counts", async () => {
    const user = userEvent.setup();
    renderTable(true, provisionalMonths);

    const septemberRow = screen.getByRole("row", { name: /sep 2026/ });
    expect(
      within(septemberRow).getByLabelText(financeCopy.performance.provisional.ariaLabel),
    ).toHaveTextContent(financeCopy.performance.provisional.chip);
    expect(within(septemberRow).getByText("Puede bajar")).toBeInTheDocument();
    expect(
      within(septemberRow).getByText("2 viajes sin terminar · 1 con gastos sin aprobar"),
    ).toBeInTheDocument();
    // YoY deltas remain for provisional closed months
    expect(within(septemberRow).getByLabelText("subió +25.0%")).toBeInTheDocument();

    const octoberRow = screen.getByRole("row", { name: /oct 2026 \(en curso\)/ });
    expect(
      within(octoberRow).queryByText(financeCopy.performance.provisional.chip),
    ).not.toBeInTheDocument();

    await user.hover(
      within(septemberRow).getByLabelText(financeCopy.performance.provisional.ariaLabel),
    );
    expect(
      await screen.findByRole("tooltip", {
        name: "sep 2026 todavía puede cambiar: hay viajes sin terminar o gastos sin aprobar.",
      }),
    ).toBeInTheDocument();
  });
});
