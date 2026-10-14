import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { renderWithTheme } from "@/test/renderWithTheme";
import { financeCopy } from "../copy";
import { FinanceAnalysisPage } from "./FinanceAnalysisPage";

vi.mock("./FinanceAnalysisContent", () => ({
  FinanceAnalysisContent: ({ view }: { view: string }) => (
    <div data-testid="analysis-view">{view}</div>
  ),
}));

vi.mock("@shared/utils/reportsWayfinding", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@shared/utils/reportsWayfinding")>();
  return {
    ...actual,
    useReportsReturnHref: () => "/reports",
  };
});

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

const section = financeCopy.page.sections.analysis;
const labels = financeCopy.page.analysisViews;

function renderPage(path: string) {
  return renderWithTheme(
    <>
      <FinanceAnalysisPage />
      <LocationProbe />
    </>,
    { route: [path], resolvedTheme: "light" },
  );
}

describe("FinanceAnalysisPage — hub shell F1", () => {
  it("renders HubPageShell title and three nav tabs", () => {
    renderPage("/finance/analysis");

    expect(
      screen.getByRole("heading", { name: section.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(section.subtitle)).toBeInTheDocument();

    const nav = screen.getByRole("tablist", { name: labels.ariaLabel });
    const tabs = within(nav)
      .getAllByRole("tab")
      .map((tab) => tab.textContent);
    expect(tabs).toEqual([labels.performance, labels.margin, labels.expenses]);
    expect(screen.getByTestId("analysis-view")).toHaveTextContent("performance");
  });

  it("switches view with one click and updates ?view=", async () => {
    const user = userEvent.setup();
    renderPage("/finance/analysis");

    await user.click(screen.getByRole("tab", { name: labels.margin }));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/finance/analysis?view=margin",
    );
    expect(screen.getByTestId("analysis-view")).toHaveTextContent("margin");
  });

  it("preserves from/to when navigating margin ↔ expenses", async () => {
    const user = userEvent.setup();
    renderPage(
      "/finance/analysis?view=margin&from=2026-07-01&to=2026-09-30&scope=pipeline",
    );

    const expensesTab = screen.getByRole("tab", { name: labels.expenses });
    expect(expensesTab).toHaveAttribute(
      "href",
      "/finance/analysis?from=2026-07-01&to=2026-09-30&view=expenses",
    );

    await user.click(expensesTab);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/finance/analysis?from=2026-07-01&to=2026-09-30&view=expenses",
    );
    expect(screen.getByTestId("analysis-view")).toHaveTextContent("expenses");

    const marginTab = screen.getByRole("tab", { name: labels.margin });
    expect(marginTab).toHaveAttribute(
      "href",
      "/finance/analysis?from=2026-07-01&to=2026-09-30&view=margin",
    );
  });

  it("shows Reports wayfinding when coming from the catalog", () => {
    renderPage("/finance/analysis");
    expect(
      screen.getByRole("link", { name: /Volver a reportes/i }),
    ).toHaveAttribute("href", "/reports");
  });

  it("does not render the local radiogroup or ListingFilterPanel vacío", () => {
    renderPage("/finance/analysis");
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Filtros/ }),
    ).not.toBeInTheDocument();
  });
});
