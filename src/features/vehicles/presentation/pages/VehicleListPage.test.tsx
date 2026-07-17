import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehicleListPage } from "./VehicleListPage";
import { vehiclesCopy } from "../copy/vehiclesCopy";

const BRANCH_ID = "11111111-1111-4111-8111-111111111111";

const { mockUseVehicles, mockUseDeleteVehicle, mockUseBranches } = vi.hoisted(
  () => ({
    mockUseVehicles: vi.fn(),
    mockUseDeleteVehicle: vi.fn(),
    mockUseBranches: vi.fn(),
  }),
);

vi.mock("../../application", () => ({
  useVehicles: (...args: unknown[]) => mockUseVehicles(...args),
  useDeleteVehicle: (...args: unknown[]) => mockUseDeleteVehicle(...args),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: (...args: unknown[]) => mockUseBranches(...args),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function renderPage(initialUrl = "/vehicles") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <VehicleListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VehicleListPage branch filter", () => {
  beforeEach(() => {
    mockUseBranches.mockReturnValue({
      data: {
        data: [
          {
            id: BRANCH_ID,
            code: "SUC-N",
            name: "Norte",
            status: "active",
            isActive: true,
          },
        ],
      },
    });
    mockUseVehicles.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseDeleteVehicle.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("pasa branchId a useVehicles desde la URL", () => {
    renderPage(`/vehicles?branchId=${BRANCH_ID}`);

    expect(mockUseVehicles).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ branchId: BRANCH_ID }),
      }),
    );
    expect(
      screen.getByText(vehiclesCopy.list.filters.chipBranch("SUC-N — Norte")),
    ).toBeInTheDocument();
  });

  it("sin branchId en URL no filtra por sucursal", () => {
    renderPage();

    expect(mockUseVehicles).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          branchId: undefined,
        }),
      }),
    );
    expect(
      screen.getByText(vehiclesCopy.list.filters.allBranches),
    ).toBeInTheDocument();
  });
});
