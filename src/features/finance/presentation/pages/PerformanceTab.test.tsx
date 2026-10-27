import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { MonthlyPerformance, PeriodFinancials } from "@features/finance/domain";
import { financeCopy } from "../copy";
import { PerformanceTab } from "./PerformanceTab";

const performanceQuery = vi.hoisted(() => ({
  data: undefined as MonthlyPerformance | undefined,
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
    useMonthlyPerformance: () => ({
      data: performanceQuery.data,
      isLoading: performanceQuery.isLoading,
      isError: performanceQuery.isError,
      refetch: performanceQuery.refetch,
    }),
  };
});

vi.mock("../components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../components")>();
  return {
    ...actual,
    PerformanceKpiCards: () => <div data-testid="performance-kpis" />,
    PerformanceComparisonChart: () => <div data-testid="performance-chart" />,
    PerformanceMonthlyTable: () => <div data-testid="performance-table" />,
  };
});

const copy = financeCopy.performance;

function month(period: string, split: boolean): PeriodFinancials {
  return {
    period,
    actualRevenue: 1000,
    actualCost: 400,
    actualMargin: 600,
    operationalCost: 400,
    operationalMargin: 600,
    tripExpensesCost: split ? 300 : undefined,
    tripCommissionCost: split ? 100 : undefined,
    periodPersonnelCost: 50,
    tripCount: 2,
    incompleteTripCount: 0,
    tripsWithPendingExpenses: 0,
    provisional: false,
  };
}

function withActivity(
  marginBasis: MonthlyPerformance["marginBasis"],
  split: boolean,
): MonthlyPerformance {
  return {
    periods: ["2026-09", "2026-10"],
    current: [month("2026-09", split), month("2026-10", split)],
    previous: [month("2025-09", split), month("2025-10", split)],
    marginBasis,
  };
}

describe("PerformanceTab — D7 KPI vs Resultado operativo", () => {
  beforeEach(() => {
    performanceQuery.isLoading = false;
    performanceQuery.isError = false;
  });

  it("hides the KPI cards when the Resultado operativo is shown above", () => {
    performanceQuery.data = withActivity("operational", true);
    renderWithTheme(<PerformanceTab />, {
      route: ["/finance/analysis?view=performance"],
      resolvedTheme: "light",
    });
    expect(screen.queryByTestId("performance-kpis")).not.toBeInTheDocument();
    expect(screen.getByTestId("performance-chart")).toBeInTheDocument();
    expect(screen.getByTestId("performance-table")).toBeInTheDocument();
  });

  it.each([
    ["trip_expenses basis", withActivity("trip_expenses", true)],
    ["API without expense/commission split", withActivity("operational", false)],
  ])("keeps the KPI cards with %s (no Resultado)", (_label, data) => {
    performanceQuery.data = data;
    renderWithTheme(<PerformanceTab />, {
      route: ["/finance/analysis?view=performance"],
      resolvedTheme: "light",
    });
    expect(screen.getByTestId("performance-kpis")).toBeInTheDocument();
  });
});

describe("PerformanceTab — F2 empty/error", () => {
  beforeEach(() => {
    performanceQuery.data = { periods: [], current: [], previous: [] };
    performanceQuery.isLoading = false;
    performanceQuery.isError = false;
    performanceQuery.refetch.mockClear();
  });

  it("empty único: un EmptyState sin KPIs/chart/tabla", () => {
    renderWithTheme(<PerformanceTab />, {
      route: ["/finance/analysis?view=performance"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.getByText(copy.empty.description)).toBeInTheDocument();
    expect(screen.queryByTestId("performance-kpis")).not.toBeInTheDocument();
    expect(screen.queryByTestId("performance-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("performance-table")).not.toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard con Reintentar en action", async () => {
    const user = userEvent.setup();
    performanceQuery.isError = true;

    renderWithTheme(<PerformanceTab />, {
      route: ["/finance/analysis?view=performance"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.error.title)).toBeInTheDocument();
    expect(screen.queryByText(copy.empty.title)).not.toBeInTheDocument();
    const retry = screen.getByRole("button", { name: copy.error.retry });
    await user.click(retry);
    expect(performanceQuery.refetch).toHaveBeenCalled();
  });

  it("banner info: ventana + scope always-on; 4 renglones bajo ¿Qué incluye? sin fórmula", async () => {
    const user = userEvent.setup();
    performanceQuery.data = withActivity("operational", true);

    renderWithTheme(<PerformanceTab />, {
      route: ["/finance/analysis?view=performance"],
      resolvedTheme: "light",
    });

    expect(
      screen.getByText(/Ventana de la gráfica:.*No cambia con el periodo de arriba\./),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.scopeNote)).toBeInTheDocument();
    for (const line of copy.scopeNoteDetail) {
      expect(screen.queryByText(line)).not.toBeInTheDocument();
    }
    expect(
      screen.queryByText(copy.operationalCostLegend),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.scopeIncludesShow }),
    );
    for (const line of copy.scopeNoteDetail) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    expect(
      screen.queryByText(copy.operationalCostLegend),
    ).not.toBeInTheDocument();
    expect(copy.scopeNoteDetail).toHaveLength(4);
  });

  it("aviso YoY vacío queda junto al switch (aria-describedby)", () => {
    performanceQuery.data = {
      periods: ["2026-09", "2026-10"],
      current: [month("2026-09", true), month("2026-10", true)],
      previous: [],
      marginBasis: "operational",
    };

    renderWithTheme(<PerformanceTab />, {
      route: ["/finance/analysis?view=performance"],
      resolvedTheme: "light",
    });

    const compareSwitch = screen.getByRole("switch", {
      name: copy.controls.compareLabel,
    });
    const describedBy = compareSwitch.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const notice = document.getElementById(describedBy!);
    expect(notice).toBeTruthy();
    expect(notice).toHaveAttribute("role", "status");
    expect(notice!.textContent).toMatch(/Aún no hay datos/);
    expect(compareSwitch.compareDocumentPosition(notice!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
