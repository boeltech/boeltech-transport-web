import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DriversListPage } from "./DriversListPage";
import { driversCopy } from "../copy/driversCopy";

const BRANCH_ID = "11111111-1111-4111-8111-111111111111";

const { mockUseDrivers, mockUseDeleteDriver, mockUseBranches } = vi.hoisted(
  () => ({
    mockUseDrivers: vi.fn(),
    mockUseDeleteDriver: vi.fn(),
    mockUseBranches: vi.fn(),
  }),
);

vi.mock("../../application", () => ({
  useDrivers: (...args: unknown[]) => mockUseDrivers(...args),
  useDeleteDriver: (...args: unknown[]) => mockUseDeleteDriver(...args),
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

function renderPage(initialUrl = "/drivers") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <DriversListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("DriversListPage branch filter", () => {
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
    mockUseDrivers.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseDeleteDriver.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  it("pasa branchId a useDrivers desde la URL", () => {
    renderPage(`/drivers?branchId=${BRANCH_ID}`);

    expect(mockUseDrivers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ branchId: BRANCH_ID }),
      }),
    );
    expect(
      screen.getByText(driversCopy.list.filters.chipBranch("SUC-N — Norte")),
    ).toBeInTheDocument();
  });

  it("sin branchId en URL no filtra por sucursal", () => {
    renderPage();

    expect(mockUseDrivers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          branchId: undefined,
        }),
      }),
    );
    expect(
      screen.getByText(driversCopy.list.filters.allBranches),
    ).toBeInTheDocument();
  });
});
