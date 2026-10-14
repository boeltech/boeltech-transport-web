import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import { BranchesListPage } from "./BranchesListPage";
import { branchesCopy } from "../copy/branchesCopy";

const copy = branchesCopy.list;

const { mockUseBranches, mockUseExportBranches } = vi.hoisted(() => ({
  mockUseBranches: vi.fn(),
  mockUseExportBranches: vi.fn(),
}));

vi.mock("../../application", () => ({
  useBranches: (...args: unknown[]) => mockUseBranches(...args),
  useExportBranches: (...args: unknown[]) => mockUseExportBranches(...args),
  useDeleteBranch: () => ({ mutate: vi.fn(), isPending: false }),
  useRestoreBranch: () => ({ mutate: vi.fn(), isPending: false }),
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
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialUrl]}>
          <BranchesListPage />
        </MemoryRouter>
      </TooltipProvider>
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

  it("empty tope plan no muestra CTA de alta no-op (D10)", () => {
    mockUseBranches.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
        meta: {
          activeCount: 2,
          maxBranches: 2,
          limitReached: true,
          overQuota: false,
          overQuotaCount: 0,
          planEligibleBranchIds: [],
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(copy.empty.descriptionClear)).toBeInTheDocument();
    // Primary toolbar CTA queda disabled; el empty no ofrece alta muerta.
    const createButtons = screen.getAllByRole("button", {
      name: copy.actions.create,
    });
    expect(createButtons).toHaveLength(1);
    expect(createButtons[0]).toBeDisabled();
  });
});
