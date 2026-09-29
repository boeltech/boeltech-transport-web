import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchesListPage } from "./BranchesListPage";
import { branchesCopy } from "../copy/branchesCopy";

const copy = branchesCopy.list;

const {
  mockUseBranches,
  mockUseDeleteBranch,
  mockUseRestoreBranch,
  mockUseExportBranches,
} = vi.hoisted(() => ({
  mockUseBranches: vi.fn(),
  mockUseDeleteBranch: vi.fn(),
  mockUseRestoreBranch: vi.fn(),
  mockUseExportBranches: vi.fn(),
}));

vi.mock("../../application", () => ({
  useBranches: (...args: unknown[]) => mockUseBranches(...args),
  useDeleteBranch: (...args: unknown[]) => mockUseDeleteBranch(...args),
  useRestoreBranch: (...args: unknown[]) => mockUseRestoreBranch(...args),
  useExportBranches: (...args: unknown[]) => mockUseExportBranches(...args),
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

function renderPage(initialUrl = "/branches") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <BranchesListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BranchesListPage toolbar", () => {
  beforeEach(() => {
    mockUseBranches.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseDeleteBranch.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseRestoreBranch.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockUseExportBranches.mockReturnValue({
      exportBranches: vi.fn(),
      isExporting: false,
    });
  });

  it("pasa status e isMain desde la URL y muestra chips", () => {
    renderPage("/branches?status=active&isMain=true");

    expect(mockUseBranches).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          status: "active",
          isMain: true,
          isActive: true,
        }),
      }),
    );
    expect(screen.getByText(copy.chip.status("Activa"))).toBeInTheDocument();
    expect(screen.getByText(copy.chip.type(true))).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(copy.empty.descriptionFiltered)).toBeInTheDocument();
  });

  it("sin recortes no pone estado, tipo ni fechas en el riel", () => {
    renderPage();

    expect(mockUseBranches).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          status: undefined,
          isMain: undefined,
          isActive: true,
        }),
      }),
    );
    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(copy.filter.searchPlaceholder),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.export.aria }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.showDeleted.aria }),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.filter.statusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filter.createdHeading)).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty.descriptionClear)).toBeInTheDocument();
  });

  it("el toggle de eliminadas no suma al badge de Filtros", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: copy.showDeleted.aria }));

    expect(mockUseBranches).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ isActive: false }),
      }),
    );
    expect(
      screen.getByRole("button", {
        name: `Quitar filtro ${copy.showDeleted.chip}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
    expect(screen.queryByText(copy.actions.create)).not.toBeInTheDocument();
  });
});
