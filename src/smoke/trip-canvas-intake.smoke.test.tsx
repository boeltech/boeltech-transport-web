/**
 * Smoke ADR-0078 — canvas de alta + completar en detalle (Fase 4).
 * Mock de API; no requiere backend ni PAC. Happy path D6:
 * listado Reservar → canvas una pantalla → redirect /edit → riel/CTA
 * → parada sin RFC/CP31 → Confirmar reserva (scheduled).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { deepToSnake } from "@shared/api/utils/case-transformer";
import { TooltipProvider } from "@shared/ui/tooltip";
import { canvasCopy } from "@features/trips/presentation/copy/canvasCopy";
import { tripsListCopy } from "@features/trips/presentation/copy/listCopy";
import { tripDetailCopy } from "@features/trips/presentation/copy";
import { computeTripReadiness } from "@features/trips/presentation/hooks/useTripReadiness";
import { TripReadinessRail } from "@features/trips/presentation/components/trip-readiness/TripReadinessRail";
import { TripConfirmReserveButton } from "@features/trips/presentation/components/trip-readiness/TripConfirmReserveButton";
import { TripDetailRouteTab } from "@features/trips/presentation/components/trip-route/TripDetailRouteTab";
import { TripEditRedirect } from "@features/trips/presentation/pages/TripEditRedirect";
import { buildCreateTripInputFromWizardValues } from "@features/trips/presentation/pages/create/wizardToCreateTripInput";
import type { TripWizardFormValues } from "@features/trips/presentation/pages/create/components/validation";
import type { CreateStopInput } from "@features/trips/domain";
import type { StopFormData } from "@features/trips/presentation/pages/create/components/stopDialogAddressMapper";

const mocks = vi.hoisted(() => ({
  mutateAsyncCreate: vi.fn(),
  mutateAsyncReplace: vi.fn(),
  mutateSchedule: vi.fn(),
  mutateAsyncUpdateTrip: vi.fn(),
  lastKeepBillingCollapsed: undefined as boolean | undefined,
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("@shared/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/permissions")>();
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: () => true,
      isLoading: false,
      isAuthenticated: true,
      role: "admin",
    }),
    useRole: () => "admin",
  };
});

vi.mock("@features/trips/application", () => ({
  useCreateTrip: () => ({
    mutateAsync: mocks.mutateAsyncCreate,
    isPending: false,
  }),
  useClientCorridors: () => ({ data: [], isLoading: false }),
  useRouteEstimate: () => ({ data: null }),
  useTrips: () => ({
    data: {
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    },
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
  useDeleteTrip: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelTrip: () => ({ mutate: vi.fn(), isPending: false }),
  useReplaceTripStops: () => ({
    mutateAsync: mocks.mutateAsyncReplace,
    isPending: false,
  }),
  useScheduleTrip: () => ({ mutate: mocks.mutateSchedule, isPending: false }),
  useUpdateTrip: () => ({
    mutateAsync: mocks.mutateAsyncUpdateTrip,
    isPending: false,
  }),
  TripCreationError: class TripCreationError extends Error {},
}));

vi.mock("@features/vehicles/application", () => ({
  useAssignableVehicles: () => ({ data: [], isLoading: false }),
}));

vi.mock("@features/drivers/application", () => ({
  useDrivers: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock("@features/clients/application", () => ({
  useActiveClients: () => ({ data: [], isLoading: false }),
  useClientCreditSummary: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock(
  "@features/trips/presentation/pages/create/components/ReservePedidoStep",
  () => ({
    ReservePedidoStep: ({ afterClient }: { afterClient?: unknown }) => (
      <div>
        <div>pedido-step</div>
        {afterClient}
      </div>
    ),
  }),
);

vi.mock(
  "@features/trips/presentation/pages/create/components/ReserveAsignarStep",
  () => ({
    ReserveAsignarStep: () => <div>flota-step</div>,
  }),
);

vi.mock("@features/trips/presentation/components/trip-fiscal", () => ({
  useTripFiscalSheets: () => ({
    sheets: null,
    shouldShowFiscalWarningChipForStop: () => false,
    shouldShowFiscalCorrectionChipForStop: () => false,
    openFixSheet: vi.fn(),
  }),
}));

vi.mock("@shared/ui/address-picker", () => ({
  AddressPicker: ({ label }: { label?: string }) => (
    <button type="button">{label}</button>
  ),
}));

vi.mock(
  "@features/trips/presentation/pages/create/components/StopFormSheet",
  () => ({
    StopFormSheet: (props: {
      open: boolean;
      keepBillingCollapsed?: boolean;
      onSubmit: (data: StopFormData) => void;
    }) => {
      mocks.lastKeepBillingCollapsed = props.keepBillingCollapsed;
      if (!props.open) return null;
      return (
        <button
          type="button"
          onClick={() =>
            props.onSubmit({
              stopType: ["origin", "pickup"],
              locationName: "Bodega Norte",
              cityName: "Monterrey",
              satStateCode: "NLE",
              postalCode: "64000",
              street: "Calle Industria 1200",
              satCountryCode: "MEX",
              satMunicipalityCode: "039",
              sequenceOrder: 1,
            })
          }
        >
          submit-stop-no-rfc
        </button>
      );
    },
  }),
);

import { TripsListPage } from "@features/trips/presentation/pages/TripsListPage";
import { TripCanvasPage } from "@features/trips/presentation/pages/create/TripCanvasPage";

const listCopy = tripsListCopy;
const shell = tripDetailCopy.shell;
const routeCopy = tripDetailCopy.route;

const draftTrip = {
  id: "trip-smoke-1",
  tripCode: "TR-SMOKE",
  status: TripStatus.DRAFT,
  clientId: "cli-1",
  originBranchId: null,
  cfdiDocumentIntent: "ingreso",
  scheduledDeparture: new Date("2026-08-14T10:00:00.000Z"),
  scheduledArrival: new Date("2026-08-15T18:00:00.000Z"),
  actualDeparture: null,
  originCity: "Monterrey",
  originState: null,
  destinationCity: "Saltillo",
  destinationState: null,
  vehicleId: "veh-1",
  driverId: "drv-1",
  costs: { baseRate: 1500 },
} as Trip;

function TestProviders({
  children,
  initialEntries = ["/trips"],
}: {
  children: ReactNode;
  initialEntries?: string[];
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ADR-0078 trip canvas intake smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lastKeepBillingCollapsed = undefined;
    mocks.mutateAsyncReplace.mockResolvedValue(undefined);
  });

  it("listado: Reservar viaje va a /trips/new y no hay Alta completa ni wizard", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <Routes>
          <Route path="/trips" element={<TripsListPage />} />
          <Route path="/trips/new" element={<div>canvas-route</div>} />
        </Routes>
      </TestProviders>,
    );

    const reserveButtons = screen.getAllByRole("button", {
      name: listCopy.actions.create,
    });
    expect(reserveButtons.length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Alta completa" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Alta completa")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Pasos para crear/i),
    ).not.toBeInTheDocument();

    await user.click(reserveButtons[0]);
    expect(screen.getByText("canvas-route")).toBeInTheDocument();
  });

  it("canvas: una pantalla Pedido|Flota sin pasos wizard; payload create_intent=reserve", () => {
    render(
      <TestProviders initialEntries={["/trips/new"]}>
        <TripCanvasPage />
      </TestProviders>,
    );

    expect(
      screen.getByRole("heading", { name: canvasCopy.page.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(canvasCopy.columns.pedido)).toBeInTheDocument();
    expect(screen.getByText(canvasCopy.columns.flota)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: canvasCopy.submit.label }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Siguiente/i)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Pasos para crear/i),
    ).not.toBeInTheDocument();

    const payload = buildCreateTripInputFromWizardValues(
      {
        vehicleId: "11111111-1111-4111-8111-111111111111",
        driverId: "22222222-2222-4222-8222-222222222222",
        clientId: "33333333-3333-4333-8333-333333333333",
        scheduledDeparture: "2030-01-15T14:00",
        scheduledArrival: "",
        startMileage: 12000,
        originCity: "CDMX",
        destinationCity: "MTY",
        notes: "Canal: WhatsApp",
        baseRate: 35000,
        cfdiDocumentIntent: "ingreso",
        originBranchId: "",
        stops: [],
        cargos: [],
        expenses: [],
        internalStaff: [],
      } as unknown as TripWizardFormValues,
      undefined,
      { createIntent: "reserve" },
    );

    expect(payload.options).toEqual({ createIntent: "reserve" });
    const snake = deepToSnake(payload) as {
      options?: { create_intent?: string };
    };
    expect(snake.options?.create_intent).toBe("reserve");
  });

  it("redirect: /trips/:id/edit envía al detalle", () => {
    render(
      <TestProviders initialEntries={["/trips/trip-smoke-1/edit"]}>
        <Routes>
          <Route path="/trips/:id/edit" element={<TripEditRedirect />} />
          <Route
            path="/trips/:id"
            element={<div>detail:trip-smoke-1</div>}
          />
        </Routes>
      </TestProviders>,
    );

    expect(screen.getByText("detail:trip-smoke-1")).toBeInTheDocument();
  });

  it("detalle: riel draft + Confirmar reserva sin RFC/mercancías → schedule", async () => {
    const user = userEvent.setup();
    const readiness = computeTripReadiness(draftTrip, { cargoCount: 0 });

    render(
      <TestProviders>
        <TripReadinessRail status={TripStatus.DRAFT} items={readiness.items} />
        <TripConfirmReserveButton
          tripId="trip-smoke-1"
          tripCode="TR-SMOKE"
          status={TripStatus.DRAFT}
          clientId="cli-1"
          prospectiveAmount={1500}
          scheduledArrival={draftTrip.scheduledArrival}
          startMileage={1500}
        />
      </TestProviders>,
    );

    expect(readiness.items).toHaveLength(8);
    expect(screen.getByTestId("trip-readiness-rail")).toBeInTheDocument();
    expect(screen.getByText(shell.readiness.scheduleGroup)).toBeInTheDocument();
    expect(screen.getByText(shell.readiness.operateGroup)).toBeInTheDocument();
    expect(screen.getByText(shell.readiness.fleet)).toBeInTheDocument();
    expect(screen.getByText(shell.readiness.route)).toBeInTheDocument();
    expect(screen.getByText(shell.readiness.cargoNeedsPickup)).toBeInTheDocument();
    expect(screen.getByText(shell.readiness.rate)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: shell.action.confirmReserve }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.queryByLabelText(/RFC/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/mercanc/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: shell.action.confirm }),
    );
    expect(mocks.mutateSchedule).toHaveBeenCalledWith("trip-smoke-1");
  });

  it("parada sin CP31: Completar domicilio dispara PUT stops[] sequence 1 sin RFC", async () => {
    const user = userEvent.setup();
    render(
      <TestProviders>
        <TripDetailRouteTab
          trip={draftTrip}
          tripStatus={TripStatus.DRAFT}
          orderedStops={[]}
          progress={0}
          canEditStructural
        />
      </TestProviders>,
    );

    expect(screen.getByText(routeCopy.composer.title)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: routeCopy.action.addStop }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(routeCopy.action.openFullEdit),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: routeCopy.composer.labelHatchToggle }),
    );
    await user.type(
      screen.getByLabelText(routeCopy.composer.labelPlaceholder, {
        selector: "#trip-route-composer-origin-label",
      }),
      "Bodega Norte",
    );
    await user.click(
      screen.getByRole("button", { name: routeCopy.action.completeAddress }),
    );
    expect(mocks.lastKeepBillingCollapsed).toBe(true);
    await user.click(screen.getByRole("button", { name: "submit-stop-no-rfc" }));

    expect(mocks.mutateAsyncReplace).toHaveBeenCalledTimes(1);
    const stops = mocks.mutateAsyncReplace.mock.calls[0][0] as CreateStopInput[];
    expect(stops).toHaveLength(1);
    expect(stops[0].sequenceOrder).toBe(1);
    expect(stops[0].rfcRemitenteDestinatario).toBeUndefined();
    expect(stops[0].nombreRemitenteDestinatario).toBeUndefined();
    expect(mocks.mutateAsyncUpdateTrip).not.toHaveBeenCalled();
  });
});
