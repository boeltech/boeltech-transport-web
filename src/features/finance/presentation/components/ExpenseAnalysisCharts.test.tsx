import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { financeCopy } from "../copy";
import { ExpenseAnalysisCharts } from "./ExpenseAnalysisCharts";

vi.mock("@shared/ui/data-display", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@shared/ui/data-display")>();
  return {
    ...actual,
    BoeltechBarChart: () => <div data-testid="expense-bar-chart" />,
    BoeltechDonutChart: () => <div data-testid="expense-donut-chart" />,
  };
});

describe("ExpenseAnalysisCharts — D1/D2 periodo completo", () => {
  it("muestra barras + ranking del periodo; sin donut", () => {
    renderWithTheme(
      <ExpenseAnalysisCharts
        byCategory={{
          periods: ["2026-08", "2026-09"],
          series: { fuel: [100, 200], tolls: [50, 0] },
          total: [150, 200],
        }}
        categorySummary={[
          { category: "fuel", amount: 300 },
          { category: "tolls", amount: 50 },
        ]}
        granularity="month"
      />,
      { resolvedTheme: "light" },
    );

    expect(screen.getByTestId("expense-bar-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("expense-donut-chart")).not.toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.expenses.charts.composition.title),
    ).toBeInTheDocument();
    expect(screen.getByText(/300|\$300/)).toBeInTheDocument();
  });
});
