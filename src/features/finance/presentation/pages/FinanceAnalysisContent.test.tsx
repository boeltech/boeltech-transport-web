import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { financeCopy } from "../copy";
import { FinanceAnalysisContent } from "./FinanceAnalysisContent";

vi.mock("./PerformanceTab", () => ({
  PerformanceTab: () => <div data-testid="tab-performance" />,
}));
vi.mock("./ProfitabilityTab", () => ({
  ProfitabilityTab: () => <div data-testid="tab-margin" />,
}));
vi.mock("./ExpenseAnalysisTab", () => ({
  ExpenseAnalysisTab: () => <div data-testid="tab-expenses" />,
}));

function renderContent(
  view: "performance" | "margin" | "expenses",
  search = "",
) {
  return renderWithTheme(<FinanceAnalysisContent view={view} />, {
    route: [`/finance/analysis${search}`],
    resolvedTheme: "light",
  });
}

describe("FinanceAnalysisContent", () => {
  it.each([
    ["performance", "tab-performance"],
    ["margin", "tab-margin"],
    ["expenses", "tab-expenses"],
  ] as const)("renders %s without local radiogroup", (view, testId) => {
    renderContent(view);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("shows sticky always-on caption with period and base operativa · no es P&L", () => {
    renderContent("performance");

    const note = screen.getByRole("note", {
      name: financeCopy.analysisPeriod.stickyAriaLabel,
    });
    expect(note).toHaveTextContent(/Periodo:/i);
    expect(note).toHaveTextContent(/base operativa/i);
    expect(note).toHaveTextContent(/no es P&L/i);
    expect(note.className).toMatch(/sticky/);
  });

  it("reflects from/to from the URL in the sticky caption", () => {
    renderContent(
      "margin",
      "?view=margin&from=2026-07-01&to=2026-09-30",
    );

    const note = screen.getByRole("note", {
      name: financeCopy.analysisPeriod.stickyAriaLabel,
    });
    expect(note).toHaveTextContent(/Periodo:/i);
    expect(note).toHaveTextContent(/base operativa/i);
  });
});
