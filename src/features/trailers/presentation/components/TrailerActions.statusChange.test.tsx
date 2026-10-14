import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrailerStatus, type TrailerStatusType } from "../../domain";
import { TrailerActions } from "./TrailerActions";
import { trailersCopy } from "../copy/trailersCopy";

type Callbacks = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

const { mockUpdateMutate, mockHasPermission, callbacks } = vi.hoisted(() => ({
  mockUpdateMutate: vi.fn(),
  mockHasPermission: vi.fn(),
  callbacks: { update: {} as Callbacks },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("../../application", () => ({
  useUpdateTrailerStatus: (cb: Callbacks) => {
    callbacks.update = cb;
    return { mutate: mockUpdateMutate, isPending: false };
  },
  useDeleteTrailer: () => ({ mutate: vi.fn(), isPending: false }),
}));

const statusCopy = trailersCopy.statusChange;

function renderActions(status: TrailerStatusType = TrailerStatus.AVAILABLE) {
  return render(
    <TrailerActions
      trailerId="trailer-1"
      licensePlate="REM1234"
      status={status}
      onEdit={vi.fn()}
    />,
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: trailersCopy.actions.menu }),
  );
  return screen.findByRole("menu");
}

describe("TrailerActions status change (D6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callbacks.update = {};
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "trailers" && (action === "update" || action === "delete"),
    );
  });

  it("offers Fuera de servicio when available and confirms with updateStatus", async () => {
    const user = userEvent.setup();
    renderActions(TrailerStatus.AVAILABLE);

    const menu = await openMenu(user);
    expect(
      within(menu).getByRole("menuitem", {
        name: trailersCopy.actions.markOutOfService,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).queryByRole("menuitem", {
        name: trailersCopy.actions.markAvailable,
      }),
    ).not.toBeInTheDocument();

    await user.click(
      within(menu).getByRole("menuitem", {
        name: trailersCopy.actions.markOutOfService,
      }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(statusCopy.title);
    expect(dialog).toHaveTextContent(
      statusCopy.description("REM1234", "Disponible", "Fuera de Servicio"),
    );

    await user.click(
      within(dialog).getByRole("button", { name: statusCopy.confirm }),
    );

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: "trailer-1",
      status: TrailerStatus.OUT_OF_SERVICE,
    });
  });

  it("offers Marcar disponible when out_of_service", async () => {
    const user = userEvent.setup();
    renderActions(TrailerStatus.OUT_OF_SERVICE);

    const menu = await openMenu(user);
    expect(
      within(menu).getByRole("menuitem", {
        name: trailersCopy.actions.markAvailable,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).queryByRole("menuitem", {
        name: trailersCopy.actions.markOutOfService,
      }),
    ).not.toBeInTheDocument();

    await user.click(
      within(menu).getByRole("menuitem", {
        name: trailersCopy.actions.markAvailable,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: statusCopy.confirm }),
    );

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: "trailer-1",
      status: TrailerStatus.AVAILABLE,
    });
  });

  it("does not offer status mutations for reserved or on_trip", async () => {
    const user = userEvent.setup();

    for (const status of [TrailerStatus.RESERVED, TrailerStatus.ON_TRIP]) {
      const { unmount } = renderActions(status);
      const menu = await openMenu(user);

      expect(
        within(menu).queryByRole("menuitem", {
          name: trailersCopy.actions.markOutOfService,
        }),
      ).not.toBeInTheDocument();
      expect(
        within(menu).queryByRole("menuitem", {
          name: trailersCopy.actions.markAvailable,
        }),
      ).not.toBeInTheDocument();
      expect(
        within(menu).getByRole("menuitem", {
          name: trailersCopy.actions.delete,
        }),
      ).toBeInTheDocument();

      unmount();
    }
  });

  it("shows Alert inline in the dialog when status change fails (CA5)", async () => {
    const user = userEvent.setup();
    renderActions(TrailerStatus.AVAILABLE);

    const menu = await openMenu(user);
    await user.click(
      within(menu).getByRole("menuitem", {
        name: trailersCopy.actions.markOutOfService,
      }),
    );
    await user.click(
      screen.getByRole("button", { name: statusCopy.confirm }),
    );

    callbacks.update.onError?.(new Error("Remolque en viaje activo"));

    expect(await screen.findByText(statusCopy.errorTitle)).toBeInTheDocument();
    expect(screen.getByText("Remolque en viaje activo")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows status action with update even without delete", async () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "trailers" && action === "update",
    );
    const user = userEvent.setup();
    renderActions(TrailerStatus.AVAILABLE);

    const menu = await openMenu(user);
    expect(
      within(menu).getByRole("menuitem", {
        name: trailersCopy.actions.markOutOfService,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).queryByRole("menuitem", {
        name: trailersCopy.actions.delete,
      }),
    ).not.toBeInTheDocument();
  });
});
