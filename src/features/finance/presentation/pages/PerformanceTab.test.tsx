import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { financeCopy } from "../copy";
import { PerformanceTab } from "./PerformanceTab";

const performanceQuery = vi.hoisted(() => ({
  data: undefined as
    | { periods: string[]; current: never[]; previous: never[] }
    | undefined,
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

  it("scopeNote corto visible; detalle bajo ¿Qué incluye?", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PerformanceTab />, {
      route: ["/finance/analysis?view=performance"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.scopeNote)).toBeInTheDocument();
    expect(screen.queryByText(copy.scopeNoteDetail)).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.scopeIncludesShow }),
    );
    expect(screen.getByText(copy.scopeNoteDetail)).toBeInTheDocument();
  });
});
