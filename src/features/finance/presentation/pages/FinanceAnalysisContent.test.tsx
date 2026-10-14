import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("FinanceAnalysisContent", () => {
  it.each([
    ["performance", "tab-performance"],
    ["margin", "tab-margin"],
    ["expenses", "tab-expenses"],
  ] as const)("renders %s without local radiogroup", (view, testId) => {
    render(<FinanceAnalysisContent view={view} />);
    expect(screen.getByTestId(testId)).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });
});
