import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@shared/ui/tooltip";
import { BranchActions } from "./BranchActions";
import { branchesCopy } from "../copy/branchesCopy";
import { BRANCH_TEST_IDS } from "../../test/branchTestFixtures";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
  }),
}));

function renderActions(props: Partial<ComponentProps<typeof BranchActions>> = {}) {
  return render(
    <TooltipProvider>
      <MemoryRouter>
        <BranchActions
          branchId={BRANCH_TEST_IDS.secondary}
          branchName="Sucursal Secundaria"
          variant="buttons"
          onDelete={vi.fn()}
          onRestore={vi.fn()}
          {...props}
        />
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe("BranchActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        ["read", "update", "delete"].includes(action),
    );
  });

  it("shows restore button only for inactive branches", () => {
    const onRestore = vi.fn();
    renderActions({ isActive: false, onRestore });

    expect(
      screen.getByRole("button", { name: branchesCopy.actions.restore }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: branchesCopy.actions.delete }),
    ).toBeNull();
  });

  it("disables delete for main branch with tooltip trigger", () => {
    renderActions({ isMain: true, isActive: true });

    expect(
      screen.getByRole("button", { name: branchesCopy.actions.delete }),
    ).toBeDisabled();
  });

  it("confirms delete and calls onDelete for secondary branch", async () => {
    const onDelete = vi.fn();
    renderActions({ isMain: false, isActive: true, onDelete });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: branchesCopy.actions.delete }),
    );

    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: branchesCopy.actions.delete }),
    );

    expect(onDelete).toHaveBeenCalledWith(BRANCH_TEST_IDS.secondary);
  });

  it("confirms restore and calls onRestore", async () => {
    const onRestore = vi.fn();
    renderActions({ isActive: false, onRestore });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: branchesCopy.actions.restore }),
    );

    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: branchesCopy.actions.restore }),
    );

    expect(onRestore).toHaveBeenCalledWith(BRANCH_TEST_IDS.secondary);
  });
});
