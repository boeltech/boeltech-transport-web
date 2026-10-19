import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import { TripStatus, type TripListItem } from "@features/trips/domain";
import { tripsListCopy } from "../copy/listCopy";
import { TripCard } from "./TripCard";

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

vi.mock("../../application", () => ({
  useCancelTrip: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteTrip: () => ({ mutate: vi.fn(), isPending: false }),
}));

function listTrip(
  overrides: Partial<TripListItem> & Pick<TripListItem, "id" | "status">,
): TripListItem {
  return {
    tripCode: "T-001",
    client: { id: "c1", legalName: "Cliente" },
    vehicle: { id: "v1", plateNumber: "ABC-123" },
    driver: { id: "d1", fullName: "Conductor" },
    originCity: "A",
    originState: null,
    destinationCity: "B",
    destinationState: null,
    scheduledDeparture: new Date("2026-05-17T10:00:00.000Z"),
    scheduledArrival: null,
    cargoDescription: null,
    baseRate: 0,
    totalCost: 0,
    totalRevenue: 0,
    estimatedProfit: 0,
    cargoCount: 0,
    clientCount: 0,
    invoicing: {
      invoiceId: null,
      invoiceFolio: null,
      invoiceStatus: null,
      invoiceUuid: null,
      invoiceable: false,
      invoiceableReason: null,
    },
    requiresFiscalAttention: false,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  } as TripListItem;
}

function renderWithQuery(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("TripCard RBAC cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("no muestra menú Acciones cuando solo hay onView (read-only / portal)", () => {
    // Portal / read-only: sin create/update/delete → sin clonar ni mutar (⋯ oculto).
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "trips" && action === "read",
    );

    renderWithQuery(
      <TripCard
        trip={listTrip({ id: "t1", status: TripStatus.SCHEDULED })}
        onView={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: tripsListCopy.card.actionsAria }),
    ).not.toBeInTheDocument();
  });

  it("muestra Cancelar cuando onCancel está definido y el status lo permite", async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <TripCard
        trip={listTrip({ id: "t1", status: TripStatus.SCHEDULED })}
        onView={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: tripsListCopy.card.actionsAria,
    });
    // EntityListCard menú touch: opacity-100 sin hover (D5 / CA5).
    expect(trigger.className).toMatch(/opacity-100/);

    await user.click(trigger);
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /asignar|iniciar|timbrar/i }),
    ).not.toBeInTheDocument();
  });
});
