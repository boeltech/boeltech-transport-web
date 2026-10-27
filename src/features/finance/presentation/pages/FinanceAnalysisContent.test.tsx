import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
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
vi.mock("../components/OperatingResultCascade", () => ({
  OperatingResultSection: ({ period }: { period: { from?: string; to?: string } }) => (
    <div data-testid="operating-result">{`${period.from}|${period.to}`}</div>
  ),
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

  it.each(["performance", "margin", "expenses"] as const)(
    "mounts the Resultado operativo above the %s view with the hub period (D7)",
    (view) => {
      renderContent(view, `?view=${view}&from=2026-07-01&to=2026-09-30`);
      const result = screen.getByTestId("operating-result");
      expect(result).toHaveTextContent("2026-07-01|2026-09-30");
      expect(
        result.compareDocumentPosition(screen.getByTestId(`tab-${view}`)) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    },
  );

  it.each(["performance", "margin", "expenses"] as const)(
    "the period selector lives in the sticky strip for %s (D2)",
    (view) => {
      renderContent(view);
      const strip = screen.getByTestId("analysis-period-strip");
      expect(strip.className).toMatch(/sticky/);
      expect(
        within(strip).getByRole("combobox", { name: financeCopy.analysisPeriod.label }),
      ).toBeInTheDocument();
    },
  );

  describe("sticky caption", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-26T18:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("defaults to «Este mes» with the data cut-off and the bases legend (D1/D3)", () => {
      renderContent("performance");
      const note = screen.getByRole("note", {
        name: financeCopy.analysisPeriod.stickyAriaLabel,
      });
      expect(note).toHaveTextContent("Octubre 2026 · mes en curso · datos al 26 oct");
      expect(note).toHaveTextContent(financeCopy.pulse.basisLine);
      expect(screen.getByTestId("operating-result")).toHaveTextContent(
        "2026-10-01|2026-10-31",
      );
    });

    it("reflects from/to from the URL without cut-off for closed months", () => {
      renderContent("margin", "?view=margin&from=2026-07-01&to=2026-09-30");
      const note = screen.getByRole("note", {
        name: financeCopy.analysisPeriod.stickyAriaLabel,
      });
      expect(note).toHaveTextContent("Jul–sep 2026 · 3 meses completos");
      expect(note).not.toHaveTextContent(/datos al/);
    });
  });
});
