import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardBranchKpisWidget } from "./DashboardBranchKpisWidget";
import { dashboardCopy } from "../copy/dashboardCopy";

const { mockUseBranches, mockUseBranchKpis, mockUseBranchKpisTrend } =
  vi.hoisted(() => ({
    mockUseBranches: vi.fn(),
    mockUseBranchKpis: vi.fn(),
    mockUseBranchKpisTrend: vi.fn(),
  }));

vi.mock("@features/branches", () => ({
  useBranches: (...args: unknown[]) => mockUseBranches(...args),
}));

vi.mock("../../application/hooks/useBranchKpis", () => ({
  useBranchKpis: (...args: unknown[]) => mockUseBranchKpis(...args),
}));

vi.mock("../../application/hooks/useBranchKpisTrend", () => ({
  useBranchKpisTrend: (...args: unknown[]) => mockUseBranchKpisTrend(...args),
}));

function renderWidget() {
  const client = new QueryClient();
  const navigate = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DashboardBranchKpisWidget showFinance navigate={navigate} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { navigate };
}

describe("DashboardBranchKpisWidget", () => {
  beforeEach(() => {
    mockUseBranches.mockReturnValue({
      isLoading: false,
      data: {
        data: [
          { id: "11111111-1111-4111-8111-111111111111", name: "Norte" },
          { id: "22222222-2222-4222-8222-222222222222", name: "Sur" },
        ],
      },
    });
    mockUseBranchKpis.mockReturnValue({
      isLoading: false,
      isFetching: false,
      data: {
        period: { label: "Mes actual" },
        rows: [
          {
            branchId: "11111111-1111-4111-8111-111111111111",
            branchCode: "N",
            branchName: "Norte",
            trips: { total: 2, inProgress: 0, completed: 2, cancelled: 0 },
            fleet: {
              vehiclesTotal: 1,
              vehiclesAvailable: 1,
              vehiclesOnTrip: 0,
              vehiclesInMaintenance: 0,
            },
            drivers: { total: 1, available: 1, onTrip: 0 },
            financialMonth: {
              tripCount: 2,
              actualRevenue: 1000,
              actualCost: 400,
              actualMargin: 600,
            },
          },
          {
            branchId: "22222222-2222-4222-8222-222222222222",
            branchCode: "S",
            branchName: "Sur",
            trips: { total: 1, inProgress: 1, completed: 0, cancelled: 0 },
            fleet: {
              vehiclesTotal: 2,
              vehiclesAvailable: 1,
              vehiclesOnTrip: 1,
              vehiclesInMaintenance: 0,
            },
            drivers: { total: 2, available: 1, onTrip: 1 },
            financialMonth: {
              tripCount: 0,
              actualRevenue: 0,
              actualCost: 0,
              actualMargin: 0,
            },
          },
        ],
      },
    });
    mockUseBranchKpisTrend.mockReturnValue({
      isLoading: false,
      isFetching: false,
      data: {
        months: 6,
        periods: [
          "2026-02",
          "2026-03",
          "2026-04",
          "2026-05",
          "2026-06",
          "2026-07",
        ],
        series: [
          {
            branchId: "11111111-1111-4111-8111-111111111111",
            branchCode: "N",
            branchName: "Norte",
            tripsCompleted: [1, 0, 2, 0, 1, 2],
            financial: null,
          },
          {
            branchId: "22222222-2222-4222-8222-222222222222",
            branchCode: "S",
            branchName: "Sur",
            tripsCompleted: [0, 1, 0, 0, 0, 0],
            financial: null,
          },
        ],
      },
    });
  });

  it("muestra tabla comparativa con dos sucursales", async () => {
    renderWidget();
    expect(screen.getByText(dashboardCopy.branchKpis.title)).toBeInTheDocument();
    expect(screen.getAllByText("Norte").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sur").length).toBeGreaterThan(0);
    expect(screen.getAllByText(dashboardCopy.branchKpis.table.viewTrips)).toHaveLength(2);
    expect(
      screen.getByText(dashboardCopy.branchKpis.trend.title),
    ).toBeInTheDocument();
  });

  it("cambia months de tendencia a 12", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.branchKpis.trend.monthsOption(12),
      }),
    );

    expect(mockUseBranchKpisTrend).toHaveBeenCalledWith(
      expect.objectContaining({ months: 12 }),
    );
  });

  it("cambia period a last_30 al seleccionar 30 días", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.branchKpis.periodOptions.last_30,
      }),
    );

    expect(mockUseBranchKpis).toHaveBeenCalledWith(
      expect.objectContaining({ period: "last_30" }),
    );
  });

  it("muestra empty state sin sucursales activas", () => {
    mockUseBranches.mockReturnValue({
      isLoading: false,
      data: { data: [] },
    });
    mockUseBranchKpis.mockReturnValue({
      isLoading: false,
      isFetching: false,
      data: { period: { label: "Mes actual" }, rows: [] },
    });

    renderWidget();
    expect(
      screen.getByText(dashboardCopy.branchKpis.noBranches.title),
    ).toBeInTheDocument();
  });
});
