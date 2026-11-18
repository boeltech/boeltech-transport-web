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
      data: [
        {
          id: "drv-1",
          employeeId: "emp-driver-1",
          displayName: "Ana Lopez",
          employee: { fullName: "Ana Lopez", id: "emp-driver-1" },
          status: "available",
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("@features/trips/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/trips/application")>();
  return {
    ...actual,
    useTripExpenses: () => ({ data: [], isLoading: false }),
    useTrips: () => ({ data: { data: [] } }),
    useActiveAssignmentTripsForBusy: () => ({
      data: { items: [], truncated: false },
      isLoading: false,
    }),
    useDraftHoldAssignmentTripsForSoft: () => ({
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

vi.mock("@features/branches/application", () => ({
  useBranch: () => ({ data: { id: "br-1", name: "Monterrey" }, isLoading: false }),
}));

vi.mock("@features/monitoring/application", () => ({
  useGpsDevice: () => ({
    data: null,
    isPending: false,
    isLoading: false,
    isError: false,
  }),
  useGpsTrackingEntitlement: () => ({
    state: "not_contracted",
    showNotActivated: true,
    canUseModule: false,
    hasModule: false,
    isSuccess: true,
    isLoading: false,
    isFetching: false,
    isError: false,
  }),
}));

const mockHasPermission = vi.fn(
  (module: string, action: string) =>
    (module === "settlements" && (action === "create" || action === "read")) ||
    (module === "expenses" && action === "read"),
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

vi.mock("@features/vehicles/application", () => ({
  useAssignableVehicles: () => ({ data: [], isLoading: false }),
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
    cfdiEmissionIntent: "emitir_cfdi",
    vehicleId: "veh-1",
    vehicle: { id: "veh-1", unitNumber: "U-12", licensePlate: "XYZ-98-76" },
    driverId: "drv-1",
    driver: { id: "drv-1", fullName: "Ana Lopez", phone: "8112345678" },
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
    costs: { baseRate: 28500, fuelCost: 0, tollCost: 0, otherCosts: 0, totalCost: 0 },
    invoicing: {
      hasActiveInvoice: false,
      hasActivePrimaryInvoice: false,
      hasActivePrincipalInvoice: false,
      primaryTransportInvoiceId: null,
      canGenerateInvoice: true,
      canGenerateAccessoryInvoice: false,
      canGenerateFalseTripInvoice: false,
      hasActiveSplit: false,
      splitLegsInvoiced: 0,
      splitLegsTotal: 0,
      canGenerateSplitShareInvoice: false,
      cartaPorteAttached: false,
      invoiceId: null,
      invoiceFolio: null,
      invoiceCfdiUuid: null,
      invoiceStatus: null,
      accessoryInvoices: [],
      blockReason: null,
    },
    totalDistRec: 352,
    ...overrides,
  } as Trip;
}

function renderTab(
  trip: Trip = makeTrip(),
  {
    canEditStructural = false,
    canReassignFleet = false,
    initialEntries = ["/trips/trip-1"],
  }: {
    canEditStructural?: boolean;
    canReassignFleet?: boolean;
    initialEntries?: string[];
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <TripDetailOperationTab
          trip={trip}
          canEditStructural={canEditStructural}
          canReassignFleet={canReassignFleet}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TripDetailOperationTab — Resumen 2 col + riel (F2 / D6)", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        (module === "settlements" &&
          (action === "create" || action === "read")) ||
        (module === "expenses" && action === "read"),
    );
  });

  it("ordena columna principal: Flota → Programación → Cliente → notas; riel Resultado", () => {
    renderTab(makeTrip({ notes: "Nota al final" }));

    const fleet = screen.getByTestId("trip-operation-fleet-card");
    const schedule = screen.getByTestId("trip-operation-schedule-card");
    const client = screen.getByTestId("trip-operation-client-card");
    const staff = screen.getByTestId("trip-operation-staff-card");
    const notes = screen.getByTestId("trip-operation-notes-card");
    const result = screen.getByTestId("trip-resumen-result-rail");
    const billing = screen.getByTestId("trip-resumen-billing-rail");
    const activity = screen.getByTestId("trip-resumen-activity-rail");

    const following = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(fleet.compareDocumentPosition(schedule) & following).toBeTruthy();
    expect(schedule.compareDocumentPosition(client) & following).toBeTruthy();
    expect(client.compareDocumentPosition(notes) & following).toBeTruthy();
    expect(fleet.compareDocumentPosition(staff) & following).toBeTruthy();
    expect(result).toBeInTheDocument();
    expect(billing).toBeInTheDocument();
    expect(activity).toBeInTheDocument();
    expect(screen.queryByTestId("trip-operation-mileage-card")).not.toBeInTheDocument();
  });

  it("CTA Reasignar flota es outline (Qué sigue es la única sólida)", () => {
    renderTab(
      makeTrip({ status: TripStatus.SCHEDULED }),
      { canReassignFleet: true },
    );

    const reassign = screen.getByRole("button", { name: copy.action.reassignFleet });
    expect(reassign.className).toMatch(/border/);
    expect(reassign.className).not.toMatch(/bg-primary(?!\/)/);

    const viewClient = screen.getByRole("link", { name: copy.action.viewClient });
    expect(viewClient.className).toMatch(/border/);
  });

  it("muestra Asignar flota cuando no hay unidad ni conductor", () => {
    renderTab(
      makeTrip({
        status: TripStatus.SCHEDULED,
        vehicle: undefined,
        driver: undefined,
        driverId: undefined,
        trailers: [],
      }),
      { canReassignFleet: true },
    );

    expect(
      screen.getByRole("button", { name: copy.action.assignFleet }),
    ).toBeInTheDocument();
  });

  it("muestra cliente, unidad, conductor, placa de remolque y factura del viaje", () => {
    renderTab();

    expect(screen.getByText("Transportes Alfa")).toBeInTheDocument();
    expect(screen.getByText(copy.section.assignment)).toBeInTheDocument();
    expect(screen.getByText(/U-12/)).toBeInTheDocument();
    expect(screen.getByText("Ana Lopez")).toBeInTheDocument();
    expect(screen.getByText("ABC-12-34 · Posición 1")).toBeInTheDocument();
    expect(screen.getByText(copy.label.tripType)).toBeInTheDocument();
    expect(screen.getByText(copy.format.tripType("ingreso"))).toBeInTheDocument();
    expect(screen.getByText(copy.label.routeType)).toBeInTheDocument();
    expect(screen.getByText("Foráneo")).toBeInTheDocument();
    expect(screen.getByText(copy.state.noSupportStaff)).toBeInTheDocument();
    expect(screen.getByText(copy.label.originBranch)).toBeInTheDocument();
    expect(screen.getByText("Monterrey")).toBeInTheDocument();
  });

  it("muestra equipo de apoyo dentro de flota con Armar pago en completado", async () => {
    renderTab(
      makeTrip({
        status: TripStatus.COMPLETED,
        internalStaff: [
          {
            id: "staff-1",
            tripId: "trip-1",
            employeeId: "emp-helper-1",
            employeeFullName: "Pedro Ayudante",
            internalRole: "helper",
            isPaymentResponsible: false,
            paymentNotes: null,
            employeeNumber: null,
            employeeStatus: null,
            createdAt: new Date("2026-05-28T07:00:00.000Z"),
            updatedAt: new Date("2026-05-28T07:00:00.000Z"),
          },
        ],
      }),
    );

    expect(screen.getByText("Pedro Ayudante")).toBeInTheDocument();
    expect(screen.getByText(copy.format.staffRole("helper"))).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getAllByText(copy.action.liquidateEmployee).length,
      ).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByTestId("trip-resumen-result-rail")).toHaveTextContent(
      /Utilidad confirmada|Resultado del viaje/,
    );
  });

  it("cancelado: flota solo lectura y sin CTA reasignar", () => {
    renderTab(
      makeTrip({ status: TripStatus.CANCELLED }),
      { canReassignFleet: true, canEditStructural: true },
    );

    expect(
      screen.getByText(copy.hint.cancelledFleetReadOnly),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.reassignFleet }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(copy.rail.cancelledNoCosts),
    ).toBeInTheDocument();
  });

  it("tabla de programación compara Programado vs Real", () => {
    renderTab(
      makeTrip({
        actualDeparture: new Date("2026-05-28T08:05:00.000Z"),
      }),
    );

    expect(screen.getByText(copy.scheduleTable.scheduled)).toBeInTheDocument();
    expect(screen.getByText(copy.scheduleTable.actual)).toBeInTheDocument();
    expect(screen.getByText(copy.scheduleTable.difference)).toBeInTheDocument();
    expect(screen.getByText(copy.scheduleTable.departure)).toBeInTheDocument();
    expect(screen.getByText(/5 min después/)).toBeInTheDocument();
  });

  it("no muestra snapshot CP ni ID de cliente", () => {
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
    expect(screen.queryByTestId("trip-fleet-snapshot-card")).not.toBeInTheDocument();
  });

  it("oculta asignación y datos internos en portal cliente (D7 lean / CA6)", () => {
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
            canReassignFleet
            isClientPortalView
            showMileage={false}
            showClientLink={false}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Transportes Alfa")).toBeInTheDocument();
    expect(screen.queryByTestId("trip-operation-fleet-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trip-operation-staff-card")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.reassignFleet }),
    ).not.toBeInTheDocument();
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

  it("muestra botón 'Reasignar flota' cuando canReassignFleet es true y abre el Sheet", async () => {
    const user = userEvent.setup();
    renderTab(
      makeTrip({
        status: TripStatus.SCHEDULED,
      }),
      { canEditStructural: true, canReassignFleet: true },
    );

    const reassignButton = screen.getByRole("button", {
      name: copy.action.reassignFleet,
    });
    expect(reassignButton).toBeInTheDocument();

    await user.click(reassignButton);
    expect(
      screen.getByText(copy.fleetAssignment.sheetDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.fleetAssignment.saveButton }),
    ).toBeInTheDocument();
  });

  it("abre el sheet de flota con ?assignFleet=1 (D6 chrome alertas)", () => {
    renderTab(
      makeTrip({ status: TripStatus.SCHEDULED }),
      {
        canEditStructural: true,
        canReassignFleet: true,
        initialEntries: ["/trips/trip-1?tab=overview&assignFleet=1"],
      },
    );

    expect(
      screen.getByText(copy.fleetAssignment.sheetDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.fleetAssignment.saveButton }),
    ).toBeInTheDocument();
  });

  it("no abre el sheet por ?assignFleet=1 si canReassignFleet es false", () => {
    renderTab(
      makeTrip({ status: TripStatus.SCHEDULED }),
      {
        canReassignFleet: false,
        initialEntries: ["/trips/trip-1?tab=overview&assignFleet=1"],
      },
    );

    expect(
      screen.queryByText(copy.fleetAssignment.sheetDescription),
    ).not.toBeInTheDocument();
  });

  it("muestra reasignar flota mid-trip con canReassignFleet aunque canEditStructural sea false (ADR-0093)", async () => {
    const user = userEvent.setup();
    renderTab(
      makeTrip({
        status: TripStatus.IN_PROGRESS,
      }),
      { canEditStructural: false, canReassignFleet: true },
    );

    const reassignButton = screen.getByRole("button", {
      name: copy.action.reassignFleet,
    });
    expect(reassignButton).toBeInTheDocument();

    await user.click(reassignButton);
    expect(
      screen.getByText(copy.fleetAssignment.sheetDescriptionInProgress),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(copy.fleetAssignment.sheetDescription),
    ).not.toBeInTheDocument();
  });

  it("oculta botón 'Reasignar flota' cuando canReassignFleet es false", () => {
    renderTab(
      makeTrip({
        status: TripStatus.IN_PROGRESS,
      }),
      { canEditStructural: false, canReassignFleet: false },
    );

    expect(
      screen.queryByRole("button", { name: copy.action.reassignFleet }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.assignFleet }),
    ).not.toBeInTheDocument();
  });

  it("no monta el sheet Flota y tripulación cuando canReassignFleet es false", () => {
    renderTab(
      makeTrip({ status: TripStatus.SCHEDULED }),
      { canEditStructural: true, canReassignFleet: false },
    );

    expect(screen.getByText(copy.section.assignment)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.fleetAssignment.sheetDescription),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.fleetAssignment.saveButton }),
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
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "expenses" && action === "read",
    );

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
  });
});
