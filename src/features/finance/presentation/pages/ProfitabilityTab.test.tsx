import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
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
  };
});

const copy = financeCopy.profitability;

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderTab(search: string) {
  return renderWithTheme(
    <>
      <ProfitabilityTab />
      <LocationProbe />
    </>,
    { route: [`/finance/analysis${search}`], resolvedTheme: "light" },
  );
}

function currentSearch(): URLSearchParams {
  return new URLSearchParams(screen.getByTestId("location").textContent ?? "");
}

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

  describe("with today fixed at 2026-10-06", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-06T18:00:00Z"));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("empty en «Este mes» (default): ofrece mes anterior y ampliar a 12 meses (P1-a)", async () => {
      const user = userEvent.setup();
      renderTab("?view=margin");

      expect(screen.getByText(copy.empty.currentMonthTitle)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: copy.empty.viewPreviousMonth }));
      expect(currentSearch().get("from")).toBe("2026-09-01");
      expect(currentSearch().get("to")).toBe("2026-09-30");
    });

    it("«Ampliar a 12 meses» escribe last_12 explícito en la URL (D9)", async () => {
      const user = userEvent.setup();
      renderTab("?view=margin");

      await user.click(screen.getByRole("button", { name: copy.empty.widenPeriod }));
      expect(currentSearch().get("from")).toBe("2025-10-01");
      expect(currentSearch().get("to")).toBe("2026-09-30");
    });

    it("empty en 12 meses: sin ampliar, con CTA a Tendencia", () => {
      renderTab("?view=margin&from=2025-10-01&to=2026-09-30");

      expect(screen.getByText(copy.empty.absoluteTitle)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: copy.empty.widenPeriod }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: copy.empty.viewPerformance }),
      ).toHaveAttribute("href", "/finance/analysis?view=performance");
    });
  });

  it("muestra la base de fechas de la vista (D6)", () => {
    renderTab("?view=margin");
    expect(screen.getByText(copy.dateBasis)).toBeInTheDocument();
  });

  it("no muestra leyenda suelta de costo operativo bajo KPIs (D2)", () => {
    renderTab("?view=margin");
    expect(
      screen.queryByText(financeCopy.performance.operationalCostLegend),
    ).not.toBeInTheDocument();
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

  it("toolbar de alcance sin selector de periodo; chips + Limpiar conserva from/to (D2/D9)", async () => {
    const user = userEvent.setup();
    renderTab(
      "?view=margin&scope=pipeline&dimension=vehicle&from=2026-07-01&to=2026-09-30",
    );

    expect(
      screen.queryByRole("combobox", { name: financeCopy.analysisPeriod.label }),
    ).not.toBeInTheDocument();
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
    expect(currentSearch().get("scope")).toBeNull();
    expect(currentSearch().get("from")).toBe("2026-07-01");
    expect(currentSearch().get("to")).toBe("2026-09-30");
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
