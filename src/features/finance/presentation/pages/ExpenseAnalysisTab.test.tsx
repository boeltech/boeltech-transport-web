import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
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
  };
});

const copy = financeCopy.expenses;

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderTab(search: string) {
  return renderWithTheme(
    <>
      <ExpenseAnalysisTab />
      <LocationProbe />
    </>,
    { route: [`/finance/analysis${search}`], resolvedTheme: "light" },
  );
}

function currentSearch(): URLSearchParams {
  return new URLSearchParams(screen.getByTestId("location").textContent ?? "");
}

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

  it("aviso Gastos: debajo del empty; detalle colapsable + CTAs", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ExpenseAnalysisTab />, {
      route: ["/finance/analysis?view=expenses"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.alert.summary)).toBeInTheDocument();
    expect(screen.queryByText(copy.alert.body)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.alert.includesShow }),
    );
    expect(screen.getByText(copy.alert.body)).toBeInTheDocument();
    const trips = screen.getByRole("link", { name: copy.alert.goToTrips });
    expect(trips).toHaveAttribute("href", "/trips");
    expect(
      screen.getByRole("link", { name: copy.alert.goToProfitability }),
    ).toHaveAttribute("href", "/finance/analysis?view=margin");
  });

  it("con datos: KPIs antes del alert; Export en toolbar (fuera del alert)", () => {
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

    const kpis = screen.getByTestId("expense-kpis");
    const alert = screen.getByText(copy.alert.summary);
    const granularity = screen.getByLabelText(copy.filters.granularity);
    const exportBtn = screen.getByRole("button", { name: copy.exportCsv });
    expect(
      kpis.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      granularity.compareDocumentPosition(exportBtn) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      exportBtn.compareDocumentPosition(alert) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(exportBtn.className).toMatch(/w-full/);
  });


  it("empty accionable: Ver tendencia; ampliar periodo si no es 12 meses", () => {
    renderTab("?view=expenses&from=2026-01-01&to=2026-01-31");

    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.empty.viewPerformance }),
    ).toHaveAttribute("href", "/finance/analysis?view=performance");
    expect(
      screen.getByRole("button", { name: copy.empty.widenPeriod }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.empty.viewPreviousMonth }),
    ).not.toBeInTheDocument();
  });

  it("muestra la base de fechas de la vista (D6)", () => {
    renderTab("?view=expenses");
    expect(screen.getByText(copy.dateBasis)).toBeInTheDocument();
  });

  it("granularidad por defecto: Día con ≤31 días, Mes con periodos largos (D8)", () => {
    const { unmount } = renderTab("?view=expenses&from=2026-09-01&to=2026-09-30");
    expect(screen.getByLabelText(copy.filters.granularity)).toHaveTextContent(
      copy.filters.granularityValues.day,
    );
    expect(screen.queryByText("Filtros activos:")).not.toBeInTheDocument();
    unmount();

    renderTab("?view=expenses&from=2026-07-01&to=2026-09-30");
    expect(screen.getByLabelText(copy.filters.granularity)).toHaveTextContent(
      copy.filters.granularityValues.month,
    );
  });

  describe("with today fixed at 2026-10-06", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-06T18:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("empty en «Este mes»: «Ver mes anterior» y «Ampliar» escriben from/to (P1-a / D9)", async () => {
      const user = userEvent.setup();
      renderTab("?view=expenses");

      await user.click(screen.getByRole("button", { name: copy.empty.viewPreviousMonth }));
      expect(currentSearch().get("from")).toBe("2026-09-01");
      expect(currentSearch().get("to")).toBe("2026-09-30");

      await user.click(screen.getByRole("button", { name: copy.empty.widenPeriod }));
      expect(currentSearch().get("from")).toBe("2025-10-01");
      expect(currentSearch().get("to")).toBe("2026-09-30");
    });
  });

  it("toolbar granularidad sin selector de periodo; chips + Limpiar conserva from/to", async () => {
    const user = userEvent.setup();
    renderTab(
      "?view=expenses&granularity=week&dimension=client&from=2026-07-01&to=2026-09-30",
    );

    expect(
      screen.queryByRole("combobox", { name: financeCopy.analysisPeriod.label }),
    ).not.toBeInTheDocument();
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
    expect(currentSearch().get("granularity")).toBeNull();
    expect(currentSearch().get("from")).toBe("2026-07-01");
    expect(currentSearch().get("to")).toBe("2026-09-30");
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
