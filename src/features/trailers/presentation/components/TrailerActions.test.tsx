import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrailerActions } from "./TrailerActions";
import { trailersCopy } from "../copy/trailersCopy";

const mockHasPermission = vi.fn();
const mutate = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("../../application", () => ({
  useDeleteTrailer: () => ({
    mutate,
    isPending: false,
  }),
}));

function renderActions(onEdit?: () => void) {
  return render(
    <TrailerActions
      trailerId="trailer-1"
      licensePlate="REM1234"
      onEdit={onEdit}
    />,
  );
}

async function openActionsMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: trailersCopy.actions.menu }),
  );
  return screen.findByRole("menu");
}

describe("TrailerActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (_module: string, action: string) =>
        action === "update" || action === "delete",
    );
  });

  it("shows edit as a row button and delete inside the menu", async () => {
    const user = userEvent.setup();
    renderActions(vi.fn());

    expect(
      screen.getByRole("button", { name: trailersCopy.actions.edit }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: trailersCopy.actions.delete }),
    ).not.toBeInTheDocument();

    const menu = await openActionsMenu(user);
    expect(
      within(menu).getByRole("menuitem", { name: trailersCopy.actions.delete }),
    ).toBeInTheDocument();
  });

  it("opens a confirm dialog and does not delete on cancel", async () => {
    const user = userEvent.setup();
    renderActions(vi.fn());

    const menu = await openActionsMenu(user);
    await user.click(
      within(menu).getByRole("menuitem", { name: trailersCopy.actions.delete }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(trailersCopy.actions.deleteTitle("REM1234")),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: trailersCopy.form.cancel }),
    );

    expect(mutate).not.toHaveBeenCalled();
  });

  it("deletes only after confirming in the dialog", async () => {
    const user = userEvent.setup();
    renderActions(vi.fn());

    const menu = await openActionsMenu(user);
    await user.click(
      within(menu).getByRole("menuitem", { name: trailersCopy.actions.delete }),
    );

    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: trailersCopy.actions.delete }),
    );

    expect(mutate).toHaveBeenCalledWith("trailer-1");
  });

  it("hides the menu without trailers.delete", () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "update",
    );
    renderActions(vi.fn());

    expect(
      screen.queryByRole("button", { name: trailersCopy.actions.menu }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: trailersCopy.actions.edit }),
    ).toBeInTheDocument();
  });

  it("calls onEdit from the row button", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderActions(onEdit);

    await user.click(
      screen.getByRole("button", { name: trailersCopy.actions.edit }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
