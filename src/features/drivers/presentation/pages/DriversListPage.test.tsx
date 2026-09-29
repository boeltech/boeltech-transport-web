import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DriversListPage } from "./DriversListPage";
import { driversCopy } from "../copy/driversCopy";

const BRANCH_ID = "11111111-1111-4111-8111-111111111111";
const copy = driversCopy.list;

const {
  mockUseDrivers,
  mockUseDeleteDriver,
  mockUseBranches,
  mockHasPermission,
  mockUseRole,
} = vi.hoisted(() => ({
  mockUseDrivers: vi.fn(),
  mockUseDeleteDriver: vi.fn(),
  mockUseBranches: vi.fn(),
  mockHasPermission: vi.fn(() => true),
  mockUseRole: vi.fn(() => "admin"),
}));

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
    hasPermission: mockHasPermission,
  }),
  useRole: () => mockUseRole(),
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

describe("DriversListPage toolbar", () => {
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
    mockHasPermission.mockImplementation(() => true);
    mockUseRole.mockReturnValue("admin");
  });

  it("pasa branchId a useDrivers desde la URL y muestra el chip", () => {
    renderPage(`/drivers?branchId=${BRANCH_ID}`);

    expect(mockUseDrivers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ branchId: BRANCH_ID }),
      }),
    );
    expect(
      screen.getByText(copy.filters.chipBranch("SUC-N — Norte")),
    ).toBeInTheDocument();
  });

  it("sin recortes no filtra y no pone sucursal ni estado en el riel", () => {
    renderPage();

    expect(mockUseDrivers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          branchId: undefined,
          status: undefined,
          licenseExpiringSoon: undefined,
        }),
      }),
    );
    expect(screen.getByRole("button", { name: /Filtros/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.filter.licenseExpiring }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.filters.allBranches)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filter.statusLabel)).not.toBeInTheDocument();
  });

  it("el toggle de licencias no suma al badge de Filtros", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole("button", { name: copy.filter.licenseExpiring }),
    );

    expect(mockUseDrivers).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ licenseExpiringSoon: true }),
      }),
    );
    expect(
      screen.getByRole("button", {
        name: `Quitar filtro ${copy.chip.licenseExpiring}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
  });

  it("manager canCreate usa empty de recepción de patio", () => {
    mockUseRole.mockReturnValue("manager");
    renderPage();
    expect(
      screen.getByText(copy.empty.descriptionClearManager),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.page.descriptionManager)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.empty.descriptionClear),
    ).not.toBeInTheDocument();
  });

  it("empty RO pide el alta a administración si !drivers.create", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        !(module === "drivers" && action === "create"),
    );
    renderPage();
    expect(screen.getByText(copy.empty.descriptionReadonly)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.empty.descriptionClear),
    ).not.toBeInTheDocument();
  });
});
