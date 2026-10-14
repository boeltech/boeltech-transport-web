import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import { BranchActions } from "./BranchActions";
import { branchesCopy } from "../copy/branchesCopy";
import { BRANCH_TEST_IDS } from "../../test/branchTestFixtures";

type Callbacks = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

const {
  mockDeleteMutate,
  mockRestoreMutate,
  mockHasPermission,
  callbacks,
} = vi.hoisted(() => ({
  mockDeleteMutate: vi.fn(),
  mockRestoreMutate: vi.fn(),
  mockHasPermission: vi.fn(),
  callbacks: {
    delete: {} as Callbacks,
    restore: {} as Callbacks,
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

vi.mock("../../application", () => ({
  useDeleteBranch: (cb: Callbacks) => {
    callbacks.delete = cb;
    return { mutate: mockDeleteMutate, isPending: false };
  },
  useRestoreBranch: (cb: Callbacks) => {
    callbacks.restore = cb;
    return { mutate: mockRestoreMutate, isPending: false };
  },
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderActions(
  props: Partial<ComponentProps<typeof BranchActions>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter>
          <BranchActions
            branchId={BRANCH_TEST_IDS.secondary}
            branchName="Sucursal Secundaria"
            variant="buttons"
            {...props}
          />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe("BranchActions lifecycle (D1/D2/D7/D11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callbacks.delete = {};
    callbacks.restore = {};
    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        ["read", "update", "delete"].includes(action),
    );
  });

  it("dropdown de listado activo no ofrece Eliminar (D1)", async () => {
    const user = userEvent.setup();
    renderActions({ variant: "dropdown", isActive: true });

    await user.click(
      screen.getByRole("button", { name: branchesCopy.card.actionsAria }),
    );

    expect(
      screen.getByRole("menuitem", { name: branchesCopy.actions.viewDetail }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: branchesCopy.actions.edit }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: branchesCopy.actions.delete }),
    ).not.toBeInTheDocument();
  });

  it("dropdown Eliminadas ofrece Restaurar (D1)", async () => {
    const user = userEvent.setup();
    renderActions({ variant: "dropdown", isActive: false });

    await user.click(
      screen.getByRole("button", { name: branchesCopy.card.actionsAria }),
    );

    expect(
      screen.getByRole("menuitem", { name: branchesCopy.actions.restore }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: branchesCopy.actions.delete }),
    ).not.toBeInTheDocument();
  });

  it("header: Editar primary; Eliminar outline (D7)", () => {
    renderActions({ isActive: true, isMain: false });

    const edit = screen.getByRole("button", {
      name: branchesCopy.actions.edit,
    });
    const del = screen.getByRole("button", {
      name: branchesCopy.actions.delete,
    });

    expect(edit.className).toMatch(/bg-primary|default/);
    expect(del.className).not.toMatch(/bg-destructive(?!\/)/);
    expect(del.className).toMatch(/border|outline|text-destructive/);
  });

  it("shows restore button only for inactive branches (D2)", () => {
    renderActions({ isActive: false });

    expect(
      screen.getByRole("button", { name: branchesCopy.actions.restore }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: branchesCopy.actions.delete }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: branchesCopy.actions.edit }),
    ).toBeNull();
  });

  it("disables delete for main branch with tooltip trigger", () => {
    renderActions({ isMain: true, isActive: true });

    expect(
      screen.getByRole("button", { name: branchesCopy.actions.delete }),
    ).toBeDisabled();
  });

  it("confirms delete and calls mutate for secondary branch", async () => {
    renderActions({ isMain: false, isActive: true });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: branchesCopy.actions.delete }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: branchesCopy.actions.delete }),
    );

    expect(mockDeleteMutate).toHaveBeenCalledWith(BRANCH_TEST_IDS.secondary);
  });

  it("confirms restore and calls mutate", async () => {
    renderActions({ isActive: false });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: branchesCopy.actions.restore }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", {
        name: branchesCopy.actions.restore,
      }),
    );

    expect(mockRestoreMutate).toHaveBeenCalledWith(BRANCH_TEST_IDS.secondary);
  });

  it("muestra Alert inline en Dialog cuando falla eliminar (D11)", async () => {
    const user = userEvent.setup();
    renderActions({ isMain: false, isActive: true });

    await user.click(
      screen.getByRole("button", { name: branchesCopy.actions.delete }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: branchesCopy.actions.delete }),
    );

    callbacks.delete.onError?.(new Error("No se puede eliminar la matriz"));

    expect(
      await screen.findByText(branchesCopy.actions.deleteErrorTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No se puede eliminar la matriz"),
    ).toBeInTheDocument();
  });

  it("muestra Alert inline en Dialog cuando falla restaurar (D11)", async () => {
    const user = userEvent.setup();
    renderActions({ isActive: false });

    await user.click(
      screen.getByRole("button", { name: branchesCopy.actions.restore }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", {
        name: branchesCopy.actions.restore,
      }),
    );

    callbacks.restore.onError?.(new Error("Sin plazas libres en tu plan"));

    expect(
      await screen.findByText(branchesCopy.actions.restoreErrorTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Sin plazas libres en tu plan"),
    ).toBeInTheDocument();
  });
});
