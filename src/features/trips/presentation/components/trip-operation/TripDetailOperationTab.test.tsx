import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { tripDetailCopy } from "../../copy";
import { TripDetailOperationTab } from "./TripDetailOperationTab";

vi.mock("@features/drivers/application", () => ({
  useDrivers: () => ({
    data: {
      data: [{ id: "drv-1", employeeId: "emp-driver-1", displayName: "Ana Lopez" }],
    },
    isLoading: false,
  }),
}));

const mockHasPermission = vi.fn(
  (module: string, action: string) =>
    module === "settlements" && (action === "create" || action === "read"),
);

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", role: "admin", email: "admin@test.com" },
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/trips/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/trips/application")>();
  return {
    ...actual,
    useTrips: () => ({ data: { data: [] } }),
    useActiveAssignmentTripsForBusy: () => ({
      data: { items: [], truncated: false },
      isLoading: false,
    }),
    useUpdateTrip: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useReplaceTripStops: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    invalidateTripAssignmentResources: vi.fn(),
  };
});

vi.mock("@features/vehicles/application", () => ({
  useAssignableVehicles: () => ({ data: [], isLoading: false }),
}));

vi.mock("@features/drivers/application", () => ({
  useDrivers: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock("@features/employees", () => ({
  useEmployees: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock("@features/trailers", () => ({
  useAssignableTrailers: () => ({ data: [], isLoading: false }),
  CreateTrailerSheet: () => null,
}));

const copy = tripDetailCopy.operation;

const CLIENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tenantId: "tenant-1",
    tripCode: "VJ-001",
    status: TripStatus.IN_PROGRESS,
    scheduledDeparture: new Date("2026-05-28T08:00:00.000Z"),
    scheduledArrival: new Date("2026-05-28T18:00:00.000Z"),
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: 100_000, end: null },
    clientId: CLIENT_ID,
    client: { id: CLIENT_ID, legalName: "Transportes Alfa" },
    cfdiDocumentIntent: "ingreso",
    vehicle: { id: "veh-1", unitNumber: "U-12", licensePlate: "XYZ-98-76" },
    driverId: "drv-1",
    driver: { id: "drv-1", fullName: "Ana Lopez" },
    trailers: [
      {
        trailerId: "tr-1",
        position: 1,
        licensePlate: "ABC-12-34",
        satSubTipoRemCode: "CTR003",
        snapshotAt: "2026-05-28T07:00:00.000Z",
      },
    ],
    notes: null,
    statusHistory: [],
    ...overrides,
  } as Trip;
}

function renderTab(
  trip: Trip = makeTrip(),
  { canEditStructural = false }: { canEditStructural?: boolean } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TripDetailOperationTab
          trip={trip}
          canEditStructural={canEditStructural}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TripDetailOperationTab — ficha operativa (Capa 1 D8 / D11)", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "settlements" && (action === "create" || action === "read"),
    );
  });

  it("muestra cliente, unidad, conductor, placa de remolque y tipo de viaje", () => {
    renderTab();

    expect(screen.getByText("Transportes Alfa")).toBeInTheDocument();
    expect(screen.getByText("U-12")).toBeInTheDocument();
    expect(screen.getByText("Ana Lopez")).toBeInTheDocument();
    expect(screen.getByText("ABC-12-34 · 1")).toBeInTheDocument();
    expect(screen.getByText(copy.format.tripType("ingreso"))).toBeInTheDocument();
  });

  it("no muestra snapshot CP, SubTipoRem ni ID de cliente", () => {
    renderTab(
      makeTrip({
        client: undefined,
      }),
    );

    expect(screen.queryByText("CTR003")).not.toBeInTheDocument();
    expect(screen.queryByText(/snapshot/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SubTipoRem/i)).not.toBeInTheDocument();
    expect(screen.queryByText(CLIENT_ID)).not.toBeInTheDocument();
    expect(screen.getByText(copy.state.clientUnavailable)).toBeInTheDocument();
  });

  it("oculta asignación y datos internos en portal cliente", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TripDetailOperationTab
            trip={makeTrip({
              notes: "Nota interna del viaje",
              internalStaff: [
                {
                  id: "staff-1",
                  employeeId: "emp-1",
                  employeeFullName: "Ayudante Interno",
                  internalRole: "helper",
                  isPaymentResponsible: true,
                  paymentNotes: "Pago en efectivo",
                },
              ],
            })}
            canEditStructural={false}
            isClientPortalView
            showMileage={false}
            showClientLink={false}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Transportes Alfa")).toBeInTheDocument();
    expect(screen.queryByText("U-12")).not.toBeInTheDocument();
    expect(screen.queryByText("Ana Lopez")).not.toBeInTheDocument();
    expect(screen.queryByText("Nota interna del viaje")).not.toBeInTheDocument();
    expect(screen.queryByText("Ayudante Interno")).not.toBeInTheDocument();
  });

  it("shows notes from trip prop (raw trip, not timeline merge)", () => {
    renderTab(
      makeTrip({
        notes: "Nota operativa del GET trip",
      }),
    );

    expect(screen.getByText("Nota operativa del GET trip")).toBeInTheDocument();
  });

  it("muestra botón 'Reasignar flota' cuando canEditStructural es true y abre el Sheet", async () => {
    const user = userEvent.setup();
    renderTab(
      makeTrip({
        status: TripStatus.SCHEDULED,
      }),
      { canEditStructural: true },
    );

    const reassignButton = screen.getByRole("button", {
      name: copy.action.reassignFleet,
    });
    expect(reassignButton).toBeInTheDocument();

    await user.click(reassignButton);
    expect(
      screen.getByText(copy.fleetAssignment.sheetTitle),
    ).toBeInTheDocument();
  });

  it("oculta botón 'Reasignar flota' cuando canEditStructural es false", () => {
    renderTab(
      makeTrip({
        status: TripStatus.IN_PROGRESS,
      }),
      { canEditStructural: false },
    );

    expect(
      screen.queryByRole("button", { name: copy.action.reassignFleet }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.assignFleet }),
    ).not.toBeInTheDocument();
  });

  it("no monta el sheet Flota y tripulación cuando canEditStructural es false", () => {
    renderTab(
      makeTrip({ status: TripStatus.SCHEDULED }),
      { canEditStructural: false },
    );

    expect(
      screen.queryByText(copy.fleetAssignment.sheetTitle),
    ).not.toBeInTheDocument();
  });

  it("muestra CTAs de liquidación en viaje completado para roles con permisos", async () => {
    renderTab(
      makeTrip({
        status: TripStatus.COMPLETED,
        internalStaff: [
          {
            id: "staff-1",
            tripId: "trip-1",
            employeeId: "emp-helper-1",
            employeeFullName: "Ayudante Interno",
            internalRole: "helper",
            isPaymentResponsible: false,
            paymentNotes: null,
          },
        ],
      }),
    );

    await waitFor(() => {
      expect(screen.getAllByText(copy.action.liquidateEmployee).length).toBeGreaterThanOrEqual(1);
    });
    expect(
      screen
        .getAllByRole("link")
        .some((link) =>
          link.getAttribute("href")?.includes("employeeId=emp-helper-1"),
        ),
    ).toBe(true);
    expect(screen.getByText(copy.action.viewTripSettlements)).toBeInTheDocument();
  });

  it("oculta CTAs de liquidación cuando el usuario no tiene permisos de settlements", () => {
    mockHasPermission.mockReturnValue(false);

    renderTab(
      makeTrip({
        status: TripStatus.COMPLETED,
        internalStaff: [
          {
            id: "staff-1",
            tripId: "trip-1",
            employeeId: "emp-helper-1",
            employeeFullName: "Ayudante Interno",
            internalRole: "helper",
            isPaymentResponsible: false,
            paymentNotes: null,
          },
        ],
      }),
    );

    expect(screen.queryByText(copy.action.liquidateEmployee)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.action.viewTripSettlements)).not.toBeInTheDocument();

    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "settlements" && (action === "create" || action === "read"),
    );
  });
});
