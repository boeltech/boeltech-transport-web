import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { financeCopy } from "../copy";
import { ProfitabilityTab } from "./ProfitabilityTab";

const tripsQuery = vi.hoisted(() => ({
  data: undefined as
    | { data: never[]; pagination: { total: number } }
    | undefined,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

const aggregateQuery = vi.hoisted(() => ({
  data: [] as never[],
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
    useProfitabilityTrips: () => ({
      data: tripsQuery.data,
      isLoading: tripsQuery.isLoading,
      isError: tripsQuery.isError,
      refetch: tripsQuery.refetch,
    }),
    useProfitabilityAggregate: () => ({
      data: aggregateQuery.data,
      isLoading: aggregateQuery.isLoading,
      isError: aggregateQuery.isError,
      refetch: aggregateQuery.refetch,
    }),
  };
});

vi.mock("../components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../components")>();
  return {
    ...actual,
    ProfitabilityKpiCards: () => <div data-testid="margin-kpis" />,
    ProfitabilityMasterDetailTable: ({
      emptyState,
    }: {
      emptyState: ReactNode;
    }) => <div data-testid="margin-table">{emptyState}</div>,
    ProfitabilityScopeToolbar: () => <div data-testid="margin-scope" />,
    AnalysisPeriodSelector: () => <div data-testid="margin-period" />,
    AnalysisPeriodCaption: () => null,
  };
});

const copy = financeCopy.profitability;

describe("ProfitabilityTab — F2 empty/error + F3 chips/toolbar", () => {
  beforeEach(() => {
    tripsQuery.data = { data: [], pagination: { total: 0 } };
    tripsQuery.isLoading = false;
    tripsQuery.isError = false;
    aggregateQuery.data = [];
    aggregateQuery.isLoading = false;
    aggregateQuery.isError = false;
    tripsQuery.refetch.mockClear();
    aggregateQuery.refetch.mockClear();
  });

  it("empty de vista: un EmptyState con CTAs", () => {
    renderWithTheme(<ProfitabilityTab />, {
      route: ["/finance/analysis?view=margin"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.empty.absoluteTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.empty.widenPeriod }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.empty.viewPerformance }),
    ).toHaveAttribute("href", "/finance/analysis?view=performance");
  });

  it("error de carga usa DetailAlertCard con Reintentar en action", async () => {
    const user = userEvent.setup();
    aggregateQuery.isError = true;

    renderWithTheme(<ProfitabilityTab />, {
      route: ["/finance/analysis?view=margin"],
      resolvedTheme: "light",
    });

    expect(screen.getByText(copy.error.title)).toBeInTheDocument();
    expect(screen.queryByTestId("margin-table")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.error.retry }),
    );
    expect(tripsQuery.refetch).toHaveBeenCalled();
    expect(aggregateQuery.refetch).toHaveBeenCalled();
  });

  it("toolbar periodo/alcance sin ListingFilterPanel; chips ActiveFilterChips + Limpiar", async () => {
    const user = userEvent.setup();
    renderWithTheme(<ProfitabilityTab />, {
      route: [
        "/finance/analysis?view=margin&scope=pipeline&dimension=vehicle",
      ],
      resolvedTheme: "light",
    });

    expect(screen.getByTestId("margin-period")).toBeInTheDocument();
    expect(screen.getByTestId("margin-scope")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Filtros/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Filtros activos:")).toBeInTheDocument();
    expect(screen.getByText(copy.filters.chipScope("pipeline"))).toBeInTheDocument();
    expect(
      screen.getByText(copy.filters.chipDimension("vehicle")),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: financeCopy.page.clearFilters }),
    );
    expect(screen.queryByText("Filtros activos:")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: financeCopy.page.clearFilters }),
    ).not.toBeInTheDocument();
  });

  it("export CSV usa variante outline", () => {
    aggregateQuery.data = [
      {
        key: "c1",
        label: "ACME",
        tripCount: 1,
        totalRevenue: 1,
        totalActual: 0,
        blendedMargin: 1,
        blendedMarginPct: 100,
      },
    ] as never[];
    tripsQuery.data = { data: [], pagination: { total: 0 } };

    renderWithTheme(<ProfitabilityTab />, {
      route: ["/finance/analysis?view=margin"],
      resolvedTheme: "light",
    });

    const exportBtn = screen.getByRole("button", {
      name: copy.exportMenu.trigger,
    });
    expect(exportBtn.className).toMatch(/border/);
    expect(exportBtn.className).not.toMatch(/bg-primary(?!\/)/);
  });
});
