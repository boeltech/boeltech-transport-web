import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchOperationalKpiCard } from "./BranchOperationalKpiCard";
import { branchesCopy } from "../copy/branchesCopy";
import { dashboardCopy } from "@features/dashboard/presentation/copy/dashboardCopy";

const { mockUseBranchKpis, mockUseBranchKpisTrend } = vi.hoisted(() => ({
  mockUseBranchKpis: vi.fn(),
  mockUseBranchKpisTrend: vi.fn(),
}));

vi.mock("@features/dashboard/application/hooks/useBranchKpis", () => ({
  useBranchKpis: (...args: unknown[]) => mockUseBranchKpis(...args),
}));

vi.mock("@features/dashboard/application/hooks/useBranchKpisTrend", () => ({
  useBranchKpisTrend: (...args: unknown[]) => mockUseBranchKpisTrend(...args),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { role: "admin" },
  }),
}));

function renderCard(branchId = "11111111-1111-4111-8111-111111111111") {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BranchOperationalKpiCard branchId={branchId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const trendFixture = {
  isLoading: false,
  isFetching: false,
  data: {
    months: 6,
    periods: ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07"],
    series: [
      {
        branchId: "11111111-1111-4111-8111-111111111111",
        branchCode: "N",
        branchName: "Norte",
        tripsCompleted: [1, 0, 2, 0, 1, 2],
        financial: null,
      },
    ],
  },
};

describe("BranchOperationalKpiCard", () => {
  it("muestra métricas de la sucursal y CTA comparar", () => {
    mockUseBranchKpis.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        period: { label: "Mes actual" },
        rows: [
          {
            branchId: "11111111-1111-4111-8111-111111111111",
            branchName: "Norte",
            trips: { total: 4, inProgress: 1, completed: 2, cancelled: 1 },
            fleet: {
              vehiclesTotal: 3,
              vehiclesAvailable: 1,
              vehiclesOnTrip: 1,
              vehiclesInMaintenance: 1,
            },
            drivers: { total: 2, available: 1, onTrip: 1 },
            financialMonth: {
              tripCount: 2,
              actualRevenue: 50000,
              actualCost: 20000,
              actualMargin: 30000,
            },
          },
        ],
      },
    });
    mockUseBranchKpisTrend.mockReturnValue(trendFixture);

    renderCard();

    expect(screen.getByText(branchesCopy.detail.kpis.title)).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: branchesCopy.detail.kpis.compareCta }),
    ).toHaveAttribute(
      "href",
      "/dashboard?compareBranches=11111111-1111-4111-8111-111111111111",
    );
    expect(
      screen.getByText(branchesCopy.detail.kpis.trend.title),
    ).toBeInTheDocument();
  });

  it("pasa period last_90 al hook al cambiar selector", async () => {
    mockUseBranchKpis.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        period: { label: "Últimos 90 días" },
        rows: [
          {
            branchId: "11111111-1111-4111-8111-111111111111",
            branchName: "Norte",
            trips: { total: 4, inProgress: 1, completed: 2, cancelled: 1 },
            fleet: {
              vehiclesTotal: 3,
              vehiclesAvailable: 1,
              vehiclesOnTrip: 1,
              vehiclesInMaintenance: 1,
            },
            drivers: { total: 2, available: 1, onTrip: 1 },
            financialMonth: null,
          },
        ],
      },
    });
    mockUseBranchKpisTrend.mockReturnValue(trendFixture);

    const user = userEvent.setup();
    renderCard();

    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.branchKpis.periodOptions.last_90,
      }),
    );

    expect(mockUseBranchKpis).toHaveBeenCalledWith(
      expect.objectContaining({ period: "last_90" }),
    );
  });
});
