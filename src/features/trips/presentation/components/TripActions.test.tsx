import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@shared/ui/tooltip";

import { TripStatus } from "@features/trips/domain";
import { tripsListCopy, cloneTripCopy } from "../copy";
import { TripActions } from "./TripActions";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/trips/application", () => ({
  useCancelTrip: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTrip: () => ({ mutate: vi.fn(), isPending: false }),
  useCloneTrip: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

async function openMoreMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Más/i }));
  return screen.findByRole("menu");
}

describe("TripActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("does not show Confirmar reserva or Edición completa in the Más menu", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TripActions
          variant="detailMenu"
          tripId="trip-1"
          tripCode="TR-001"
          status={TripStatus.DRAFT}
        />
      </MemoryRouter>,
    );

    const menu = await openMoreMenu(user);
    expect(menu).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /Confirmar reserva/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /Edición completa/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: cloneTripCopy.action.label }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Cancelar viaje/i }),
    ).toBeInTheDocument();
  });

  it("hides Clonar viaje without trips.create", async () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "trips" && action !== "create",
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TripActions
          variant="detailMenu"
          tripId="trip-1"
          tripCode="TR-001"
          status={TripStatus.DRAFT}
        />
      </MemoryRouter>,
    );

    await openMoreMenu(user);
    expect(
      screen.queryByRole("menuitem", { name: cloneTripCopy.action.label }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Cancelar viaje/i }),
    ).toBeInTheDocument();
  });

  it("opens clone sheet from Más menu", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TripActions
          variant="detailMenu"
          tripId="trip-1"
          tripCode="TR-001"
          status={TripStatus.COMPLETED}
        />
      </MemoryRouter>,
    );

    await openMoreMenu(user);
    await user.click(
      screen.getByRole("menuitem", { name: cloneTripCopy.action.label }),
    );

    expect(
      await screen.findByRole("heading", { name: cloneTripCopy.sheet.title }),
    ).toBeInTheDocument();
  });

  it("warns to declare false trip instead when cancelling after a real arrival", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TooltipProvider delayDuration={0}>
          <TripActions
            variant="detailMenu"
            tripId="trip-1"
            tripCode="TR-001"
            status={TripStatus.IN_PROGRESS}
            hasRealArrival
          />
        </TooltipProvider>
      </MemoryRouter>,
    );

    await openMoreMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /Cancelar viaje/i }));

    expect(
      screen.getByText(tripsListCopy.dialog.falseTripInsteadTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tripsListCopy.dialog.falseTripInsteadCta }),
    ).toHaveAttribute("href", "/trips/trip-1?tab=tracking");
    expect(
      screen.getByRole("button", { name: tripsListCopy.dialog.cancelBack }),
    ).toBeInTheDocument();
  });

  it("does not show Confirmar reserva in the table dropdown even with onSchedule", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TripActions
          variant="dropdown"
          tripId="trip-1"
          tripCode="TR-001"
          status={TripStatus.DRAFT}
          onView={vi.fn()}
          onSchedule={vi.fn()}
          onCancel={vi.fn()}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /Abrir menú de acciones/i }),
    );
    expect(
      screen.queryByRole("menuitem", { name: /Confirmar reserva/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /^Editar$/i }),
    ).not.toBeInTheDocument();
  });
});
