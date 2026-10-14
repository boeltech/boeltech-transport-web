import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { financeCopy } from "../copy";
import { ExpenseAnalysisTab } from "./ExpenseAnalysisTab";

const categoryQuery = vi.hoisted(() => ({
  data: undefined as
    | { periods: string[]; series: Record<string, number[]>; total: number[] }
    | undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

const dimensionQuery = vi.hoisted(() => ({
  data: [] as Array<{
    key: string;
    label: string;
    tripCount: number;
    totalExpenses: number;
    avgExpensePerTrip: number;
  }>,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  ...(await import("@/test/mocks/toast")).toastHooksMock(),
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useExpensesByCategory: () => ({
      data: categoryQuery.data,
      isLoading: categoryQuery.isLoading,
      isError: categoryQuery.isError,
      refetch: categoryQuery.refetch,
    }),
    useExpensesByDimension: () => ({
      data: dimensionQuery.data,
      isLoading: dimensionQuery.isLoading,
      isError: dimensionQuery.isError,
      refetch: dimensionQuery.refetch,
    }),
  };
});

vi.mock("../components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../components")>();
  return {
    ...actual,
    ExpenseAnalysisKpiCards: () => <div data-testid="expense-kpis" />,
    ExpenseAnalysisCharts: () => <div data-testid="expense-charts" />,
    ExpenseDimensionTableSection: () => <div data-testid="expense-table" />,
    AnalysisPeriodSelector: () => <div data-testid="expense-period" />,
    AnalysisPeriodCaption: () => null,
  };
});

const copy = financeCopy.expenses;

describe("ExpenseAnalysisTab — F2 empty/error/alerta + F3 chips/toolbar", () => {
  beforeEach(() => {
    categoryQuery.data = { periods: [], series: {}, total: [] };
    categoryQuery.isLoading = false;
    categoryQuery.isError = false;
    dimensionQuery.data = [];
    dimensionQuery.isLoading = false;
    dimensionQuery.isError = false;
    categoryQuery.refetch.mockClear();
    dimensionQuery.refetch.mockClear();
  });

  it("empty único: un EmptyState sin charts ni tabla (XOR)", () => {
    renderWithTheme(<ExpenseAnalysisTab />, {
      route: ["/finance/analysis?view=expenses"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.queryByTestId("expense-charts")).not.toBeInTheDocument();
    expect(screen.queryByTestId("expense-table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("expense-kpis")).not.toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard con Reintentar en action", async () => {
    const user = userEvent.setup();
    categoryQuery.isError = true;

    renderWithTheme(<ExpenseAnalysisTab />, {
      route: ["/finance/analysis?view=expenses"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.error.title)).toBeInTheDocument();
    expect(screen.queryByText(copy.empty.title)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.error.retry }),
    );
    expect(categoryQuery.refetch).toHaveBeenCalled();
    expect(dimensionQuery.refetch).toHaveBeenCalled();
  });

  it("aviso Gastos: DetailAlertCard con CTA Ir a Viajes en action", () => {
    renderWithTheme(<ExpenseAnalysisTab />, {
      route: ["/finance/analysis?view=expenses"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.alert.includesShow)).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes(copy.alert.summary)),
    ).toBeInTheDocument();
    const trips = screen.getByRole("link", { name: copy.alert.goToTrips });
    expect(trips).toHaveAttribute("href", "/trips");
  });

  it("toolbar periodo/granularidad sin ListingFilterPanel; chips + Limpiar", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ExpenseAnalysisTab />, {
      route: ["/finance/analysis?view=expenses&granularity=week&dimension=client"],
      resolvedTheme: "light",
    });

    expect(screen.getByTestId("expense-period")).toBeInTheDocument();
    expect(
      screen.getByLabelText(financeCopy.expenses.filters.granularity),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Filtros/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Filtros activos:")).toBeInTheDocument();
    expect(
      screen.getByText(copy.filters.chipGranularity("week")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(copy.filters.chipDimension("client")),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: financeCopy.page.clearFilters }),
    );
    expect(screen.queryByText("Filtros activos:")).not.toBeInTheDocument();
  });

  it("export CSV usa variante outline", () => {
    dimensionQuery.data = [
      {
        key: "v1",
        label: "Unidad 1",
        tripCount: 1,
        totalExpenses: 100,
        avgExpensePerTrip: 100,
      },
    ];
    categoryQuery.data = {
      periods: ["2026-09"],
      series: { fuel: [100] },
      total: [100],
    };

    renderWithTheme(<ExpenseAnalysisTab />, {
      route: ["/finance/analysis?view=expenses"],
      resolvedTheme: "light",
    });

    const exportBtn = screen.getByRole("button", { name: copy.exportCsv });
    expect(exportBtn.className).toMatch(/border/);
    expect(exportBtn.className).not.toMatch(/bg-primary(?!\/)/);
  });
});
