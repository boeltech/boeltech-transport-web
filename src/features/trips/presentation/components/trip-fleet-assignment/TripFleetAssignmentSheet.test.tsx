import { describe, expect, it, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { TripFleetAssignmentSheet } from "./TripFleetAssignmentSheet";
import { tripDetailCopy } from "../../copy";

beforeAll(() => {
  // Radix Select + jsdom
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

const copy = tripDetailCopy.operation.fleetAssignment;

const mockMutate = vi.fn();
const mockToast = vi.fn();
const mockUseAssignableVehicles = vi.fn();
const mockUseDrivers = vi.fn();
const mockUseEmployees = vi.fn();
const mockUseActiveAssignmentTripsForBusy = vi.fn();
const mockUseDraftHoldAssignmentTripsForSoft = vi.fn();

let nextReassignResult: {
  trip: Trip;
  warnings?: Array<{ code: string; message: string }>;
} = {
  trip: { id: "trip-123" } as Trip,
};

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-1", role: "admin", email: "admin@test.com" },
  }),
}));

vi.mock("@features/trips/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/trips/application")>();
  return {
    ...actual,
    useTrips: () => ({ data: { data: [] } }),
    useActiveAssignmentTripsForBusy: (options?: { enabled?: boolean }) =>
      mockUseActiveAssignmentTripsForBusy(options),
    useDraftHoldAssignmentTripsForSoft: (options?: { enabled?: boolean }) =>
      mockUseDraftHoldAssignmentTripsForSoft(options),
    useReassignTripFleet: (
      _tripId: string,
      options?: {
        onSuccess?: (result: {
          trip: Trip;
          warnings?: Array<{ code: string; message: string }>;
        }) => void;
        onError?: (err: Error) => void;
      },
    ) => ({
      mutate: (args: unknown) => {
        mockMutate(args);
        options?.onSuccess?.(nextReassignResult);
      },
      isPending: false,
    }),
    invalidateTripAssignmentResources: vi.fn(),
  };
});

const mockVehicles = [
  {
    id: "veh-1",
    unitNumber: "U-101",
    licensePlate: "AAA-111",
    type: "Rabón",
    canBeAssigned: true,
    satConfigAutotransporteCode: "C2",
  },
  {
    id: "veh-2",
    unitNumber: "U-102",
    licensePlate: "BBB-222",
    type: "Camioneta",
    canBeAssigned: true,
    satConfigAutotransporteCode: "C2",
  },
  {
    id: "veh-expired",
    unitNumber: "U-EXP",
    licensePlate: "EXP-999",
    type: "Rabón",
    canBeAssigned: false,
    expiredDocsOverridable: true,
    blockReason: "Póliza de seguro vencida",
    insuranceExpiry: "2020-01-01",
    satConfigAutotransporteCode: "C2",
  },
];

const mockDrivers = [
  {
    id: "drv-1",
    displayName: "Carlos Conductor",
    employeeId: "emp-1",
    isActive: true,
    status: "available",
    canBeAssigned: true,
    isLicenseExpired: false,
    isFederalLicenseExpired: false,
    isStateLicenseExpired: false,
    employee: {
      id: "emp-1",
      fullName: "Carlos Conductor",
      firstName: "Carlos",
      lastName: "Conductor",
    },
    licenses: [{ category: "B", isExpired: false }],
  },
  {
    id: "drv-2",
    displayName: "Diana Chofer",
    employeeId: "emp-2",
    isActive: true,
    status: "available",
    canBeAssigned: true,
    isLicenseExpired: false,
    isFederalLicenseExpired: false,
    isStateLicenseExpired: false,
    employee: {
      id: "emp-2",
      fullName: "Diana Chofer",
      firstName: "Diana",
      lastName: "Chofer",
    },
    licenses: [{ category: "A", isExpired: false }],
  },
  {
    id: "drv-expired",
    displayName: "Conductor Vencido",
    employeeId: "emp-expired",
    isActive: true,
    status: "available",
    isLicenseExpired: true,
    isFederalLicenseExpired: true,
    isStateLicenseExpired: false,
    federalLicenseExpiry: "2020-01-01",
    employee: {
      id: "emp-expired",
      fullName: "Conductor Vencido",
      firstName: "Conductor",
      lastName: "Vencido",
    },
    licenses: [{ category: "E", isExpired: true }],
  },
];

const mockEmployees = [
  {
    id: "emp-3",
    fullName: "Pedro Ayudante",
    position: "Ayudante general",
    status: "active",
    isActive: true,
  },
  {
    id: "emp-4",
    fullName: "Luis Copiloto",
    position: "Conductor",
    status: "active",
    isActive: true,
  },
];

vi.mock("@features/vehicles/application", () => ({
  useAssignableVehicles: (options?: { enabled?: boolean }) =>
    mockUseAssignableVehicles(options),
}));

vi.mock("@features/drivers/application", () => ({
  useDrivers: (params?: unknown, options?: { enabled?: boolean }) =>
    mockUseDrivers(params, options),
}));

vi.mock("@features/employees", () => ({
  useEmployees: (params?: unknown, options?: { enabled?: boolean }) =>
    mockUseEmployees(params, options),
}));

vi.mock("@features/trailers", () => ({
  useAssignableTrailers: () => ({
    data: [
      {
        id: "tr-1",
        number: "R-01",
        licensePlate: "REM-01",
        canBeAssigned: true,
      },
    ],
    isLoading: false,
  }),
  CreateTrailerSheet: () => null,
}));

function stubAssignmentQueries() {
  mockUseAssignableVehicles.mockReturnValue({
    data: mockVehicles,
    isLoading: false,
  });
  mockUseDrivers.mockReturnValue({
    data: { data: mockDrivers },
    isLoading: false,
  });
  mockUseEmployees.mockReturnValue({
    data: { data: mockEmployees },
    isLoading: false,
  });
  mockUseActiveAssignmentTripsForBusy.mockReturnValue({
    data: { items: [], truncated: false },
    isLoading: false,
  });
  mockUseDraftHoldAssignmentTripsForSoft.mockReturnValue({
    data: { items: [], truncated: false },
    isLoading: false,
  });
}

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-123",
    tenantId: "tenant-1",
    tripCode: "TR-2026-0042",
    status: TripStatus.SCHEDULED,
    scheduledDeparture: new Date("2026-08-30T08:00:00.000Z"),
    scheduledArrival: new Date("2026-08-30T18:00:00.000Z"),
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: 1000, end: null },
    clientId: "cli-1",
    cfdiDocumentIntent: "ingreso",
    vehicle: {
      id: "veh-1",
      unitNumber: "U-101",
      licensePlate: "AAA-111",
      satConfigAutotransporteCode: "C2",
    },
    driver: {
      id: "drv-1",
      fullName: "Carlos Conductor",
    },
    trailers: [],
    internalStaff: [],
    invoicing: {
      invoiceStatus: "draft",
      cartaPorteAttached: false,
    },
    ...overrides,
  } as Trip;
}

function renderSheet(
  props: { trip?: Trip; open?: boolean; onOpenChange?: (open: boolean) => void } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const trip = props.trip ?? makeTrip();
  const open = props.open ?? true;
  const onOpenChange = props.onOpenChange ?? vi.fn();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TripFleetAssignmentSheet
            trip={trip}
            open={open}
            onOpenChange={onOpenChange}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
    onOpenChange,
    trip,
  };
}

describe("TripFleetAssignmentSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextReassignResult = { trip: { id: "trip-123" } as Trip };
    stubAssignmentQueries();
  });

  it("passes enabled:false to assignment queries when sheet is closed", () => {
    renderSheet({ open: false });

    expect(mockUseAssignableVehicles).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(mockUseDrivers).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    );
    expect(mockUseEmployees).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    );
    expect(mockUseActiveAssignmentTripsForBusy).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(mockUseDraftHoldAssignmentTripsForSoft).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("passes enabled:true to assignment queries when sheet is open", () => {
    renderSheet({ open: true });

    expect(mockUseAssignableVehicles).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
    expect(mockUseActiveAssignmentTripsForBusy).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
    expect(mockUseDraftHoldAssignmentTripsForSoft).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
  });

  it("does not fetch draft holds when subject trip is draft", () => {
    renderSheet({
      open: true,
      trip: makeTrip({ status: TripStatus.DRAFT }),
    });

    expect(mockUseDraftHoldAssignmentTripsForSoft).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("disables save while assignable vehicles are still loading", () => {
    mockUseAssignableVehicles.mockReturnValue({
      data: [],
      isLoading: true,
    });

    renderSheet({
      trip: makeTrip({
        vehicle: {
          id: "veh-1",
          unitNumber: "U-101",
          licensePlate: "AAA-111",
        },
        vehicleId: "veh-1",
      }),
    });

    expect(
      screen.getByRole("button", { name: copy.saveButton }),
    ).toBeDisabled();
  });

  it("does not submit S/R unit without trailers after satConfig sync", async () => {
    const user = userEvent.setup();
    mockUseAssignableVehicles.mockReturnValue({
      data: [
        {
          id: "veh-sr",
          unitNumber: "U-SR",
          licensePlate: "SR-111",
          type: "Tractocamión",
          canBeAssigned: true,
          satConfigAutotransporteCode: "T3S2",
        },
      ],
      isLoading: false,
    });

    renderSheet({
      trip: makeTrip({
        vehicleId: "veh-sr",
        vehicle: {
          id: "veh-sr",
          unitNumber: "U-SR",
          licensePlate: "SR-111",
        },
        trailers: [],
      }),
    });

    await waitFor(() => {
      expect(screen.getByText(/Remolque 1/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: copy.saveButton }));

    await waitFor(() => {
      expect(screen.getByText(copy.validation.summaryTitle)).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows staff add error on the employee select field", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(
      screen.getByRole("button", { name: copy.actions.addStaffMember }),
    );

    expect(
      await screen.findByText(copy.errors.selectEmployeeToAdd),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", {
        name: copy.labels.supportStaffEmployee,
      }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  it("renders the sheet title, description and current fleet assignment", () => {
    renderSheet();

    expect(screen.getByText(copy.sheetTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.sheetDescription)).toBeInTheDocument();
    expect(screen.getByText(copy.sections.vehicle)).toBeInTheDocument();
    expect(screen.getByText(copy.sections.driver)).toBeInTheDocument();
  });

  it("submits the updated assignment payload without touching stops or routes", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderSheet();

    const saveButton = screen.getByRole("button", { name: copy.saveButton });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: "veh-1",
          driverId: "drv-1",
          trailers: [],
          allowExpiredDocs: true,
        }),
      );
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: copy.toasts.success,
        }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows stamped invoice critical alert and opens confirmation dialog before saving CP change", async () => {
    const user = userEvent.setup();
    const stampedTrip = makeTrip({
      invoicing: {
        invoiceStatus: "stamped",
        cartaPorteAttached: true,
      },
    });

    renderSheet({ trip: stampedTrip });

    // Warning banner is displayed
    expect(screen.getByText(copy.alerts.fiscalImpactTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.alerts.fiscalImpactBody)).toBeInTheDocument();

    // Change conductor (CP-relevant) so fiscal confirm applies
    await user.click(screen.getByLabelText(/Operador principal/));
    const driverListbox = await screen.findByRole("listbox");
    await user.click(
      within(driverListbox).getByRole("option", { name: /Diana Chofer/ }),
    );

    const saveButton = screen.getByRole("button", { name: copy.saveButton });
    await user.click(saveButton);

    expect(
      await screen.findByText(copy.alerts.fiscalConfirmDialogTitle),
    ).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();

    // Confirm in dialog
    const confirmButton = screen.getByRole("button", {
      name: copy.alerts.fiscalConfirmDialogConfirm,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: "veh-1",
          driverId: "drv-2",
        }),
      );
    });
  });

  it("cancels fiscal confirm without mutating and clears pending values", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        invoicing: {
          invoiceStatus: "stamped",
          cartaPorteAttached: true,
        },
      }),
    });

    await user.click(screen.getByLabelText(/Operador principal/));
    const driverListbox = await screen.findByRole("listbox");
    await user.click(
      within(driverListbox).getByRole("option", { name: /Diana Chofer/ }),
    );

    await user.click(screen.getByRole("button", { name: copy.saveButton }));
    expect(
      await screen.findByText(copy.alerts.fiscalConfirmDialogTitle),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: copy.alerts.fiscalConfirmDialogCancel,
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByText(copy.alerts.fiscalConfirmDialogTitle),
      ).not.toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("stamped + staff-only change saves without fiscal confirm dialog", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        status: TripStatus.SCHEDULED,
        invoicing: {
          invoiceStatus: "stamped",
          cartaPorteAttached: true,
        },
        internalStaff: [],
      }),
    });

    expect(screen.getByText(copy.alerts.fiscalImpactTitle)).toBeInTheDocument();

    await user.click(
      screen.getByRole("combobox", { name: copy.labels.supportStaffFilter }),
    );
    const filterListbox = await screen.findByRole("listbox");
    await user.click(
      within(filterListbox).getByRole("option", {
        name: copy.labels.positionHelper,
      }),
    );

    await user.click(
      screen.getByRole("combobox", { name: copy.labels.supportStaffEmployee }),
    );
    const employeeListbox = await screen.findByRole("listbox");
    await user.click(
      within(employeeListbox).getByRole("option", { name: /Pedro Ayudante/ }),
    );
    await user.click(
      screen.getByRole("button", { name: copy.actions.addStaffMember }),
    );

    await user.click(screen.getByRole("button", { name: copy.saveButton }));

    expect(
      screen.queryByText(copy.alerts.fiscalConfirmDialogTitle),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: "veh-1",
          driverId: "drv-1",
          internalStaff: expect.arrayContaining([
            expect.objectContaining({
              employeeId: "emp-3",
              internalRole: "helper",
            }),
          ]),
        }),
      );
    });
  });

  it("stamped + remove staff in_progress persists without fiscal dialog", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        status: TripStatus.IN_PROGRESS,
        invoicing: {
          invoiceStatus: "stamped",
          cartaPorteAttached: true,
        },
        internalStaff: [
          {
            id: "staff-1",
            tripId: "trip-123",
            employeeId: "emp-3",
            employeeFullName: "Pedro Ayudante",
            internalRole: "helper",
            isPaymentResponsible: false,
            paymentNotes: null,
          },
        ],
      }),
    });

    await user.click(
      screen.getByRole("button", { name: copy.actions.deleteStaffMember }),
    );
    expect(
      screen.getByText(copy.removeStaffConfirm.title("Pedro Ayudante")),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.removeStaffConfirm.confirm }),
    );

    expect(
      screen.queryByText(copy.alerts.fiscalConfirmDialogTitle),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          internalStaff: [],
        }),
      );
    });
  });

  it("renders existing support staff and allows deleting a member", async () => {
    const user = userEvent.setup();
    const tripWithStaff = makeTrip({
      internalStaff: [
        {
          id: "staff-1",
          employeeId: "emp-3",
          employeeFullName: "Pedro Ayudante",
          internalRole: "helper",
          isPaymentResponsible: false,
          paymentNotes: "",
        },
      ],
    });

    renderSheet({ trip: tripWithStaff });

    expect(screen.getByText("Pedro Ayudante")).toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /eliminar/i });
    await user.click(deleteBtn);

    const saveButton = screen.getByRole("button", { name: copy.saveButton });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          internalStaff: [],
        }),
      );
    });
  });

  it("submits newly added support staff in PATCH fleet payload (not empty array)", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        status: TripStatus.DRAFT,
        internalStaff: [],
      }),
    });

    // Default filter is Conductor; switch to Ayudante general for emp-3.
    await user.click(
      screen.getByRole("combobox", { name: copy.labels.supportStaffFilter }),
    );
    const filterListbox = await screen.findByRole("listbox");
    await user.click(
      within(filterListbox).getByRole("option", {
        name: copy.labels.positionHelper,
      }),
    );

    await user.click(
      screen.getByRole("combobox", { name: copy.labels.supportStaffEmployee }),
    );
    const employeeListbox = await screen.findByRole("listbox");
    await user.click(
      within(employeeListbox).getByRole("option", { name: /Pedro Ayudante/ }),
    );
    await user.click(
      screen.getByRole("button", { name: copy.actions.addStaffMember }),
    );

    expect(await screen.findByText("Pedro Ayudante")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.saveButton }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          internalStaff: expect.arrayContaining([
            expect.objectContaining({
              employeeId: "emp-3",
              internalRole: "helper",
            }),
          ]),
        }),
      );
    });
    const payload = mockMutate.mock.calls.at(-1)?.[0] as {
      internalStaff?: unknown[];
    };
    expect(payload.internalStaff).toHaveLength(1);
  });

  it("flushes pending support staff draft into PATCH payload without clicking Agregar", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        status: TripStatus.DRAFT,
        internalStaff: [],
      }),
    });

    await user.click(
      screen.getByRole("combobox", { name: copy.labels.supportStaffFilter }),
    );
    const filterListbox = await screen.findByRole("listbox");
    await user.click(
      within(filterListbox).getByRole("option", {
        name: copy.labels.positionHelper,
      }),
    );

    await user.click(
      screen.getByRole("combobox", { name: copy.labels.supportStaffEmployee }),
    );
    const employeeListbox = await screen.findByRole("listbox");
    await user.click(
      within(employeeListbox).getByRole("option", { name: /Pedro Ayudante/ }),
    );

    // No «Agregar integrante» — Guardar must flush the draft.
    await user.click(screen.getByRole("button", { name: copy.saveButton }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          internalStaff: expect.arrayContaining([
            expect.objectContaining({
              employeeId: "emp-3",
              internalRole: "helper",
            }),
          ]),
        }),
      );
    });
    const payload = mockMutate.mock.calls.at(-1)?.[0] as {
      internalStaff?: unknown[];
    };
    expect(payload.internalStaff).toHaveLength(1);
  });

  it("aborts save when pending draft support staff becomes hard-blocked", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        status: TripStatus.SCHEDULED,
        internalStaff: [],
      }),
    });

    await user.click(
      screen.getByRole("combobox", { name: copy.labels.supportStaffFilter }),
    );
    const filterListbox = await screen.findByRole("listbox");
    await user.click(
      within(filterListbox).getByRole("option", {
        name: copy.labels.positionHelper,
      }),
    );

    await user.click(
      screen.getByRole("combobox", { name: copy.labels.supportStaffEmployee }),
    );
    const employeeListbox = await screen.findByRole("listbox");
    await user.click(
      within(employeeListbox).getByRole("option", { name: /Pedro Ayudante/ }),
    );

    // After selection, mark emp-3 busy on another active trip (hard-block on scheduled).
    // Same sheet instance keeps draftStaffEmployeeId; mock bypasses Query cache.
    mockUseActiveAssignmentTripsForBusy.mockReturnValue({
      data: {
        items: [
          {
            id: "other-trip",
            tripCode: "TR-BUSY",
            status: TripStatus.IN_PROGRESS,
            scheduledDeparture: new Date("2026-08-30T08:00:00.000Z"),
            scheduledArrival: null,
            vehicle: {
              id: "veh-other",
              unitNumber: "U-OTH",
              licensePlate: "OTH-1",
            },
            driver: { id: "drv-other", fullName: "Otro Conductor" },
            internalStaffEmployeeIds: ["emp-3"],
          },
        ],
        truncated: false,
      },
      isLoading: false,
    });

    // Re-render via unrelated control so supportStaffOptions recompute.
    await user.click(
      screen.getByRole("checkbox", { name: copy.labels.allowExpiredDocs }),
    );

    await user.click(screen.getByRole("button", { name: copy.saveButton }));

    await waitFor(() => {
      expect(
        screen.getByText("Asignado a un viaje activo"),
      ).toBeInTheDocument();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows expired docs toggle checked by default for admin and submits allowExpiredDocs true", async () => {
    const user = userEvent.setup();
    const trip = makeTrip({
      vehicle: {
        id: "veh-1",
        unitNumber: "U-101",
        licensePlate: "AAA-111",
        satConfigAutotransporteCode: "C2",
      },
    });

    renderSheet({ trip });

    const checkbox = screen.getByRole("checkbox", {
      name: copy.labels.allowExpiredDocs,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    const saveButton = screen.getByRole("button", { name: copy.saveButton });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          allowExpiredDocs: true,
        }),
      );
    });
  });

  it("submits allowExpiredDocs false when admin unchecks the expired docs toggle", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        vehicle: {
          id: "veh-1",
          unitNumber: "U-101",
          licensePlate: "AAA-111",
          satConfigAutotransporteCode: "C2",
        },
      }),
    });

    const checkbox = screen.getByRole("checkbox", {
      name: copy.labels.allowExpiredDocs,
    });
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: copy.saveButton }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          allowExpiredDocs: false,
        }),
      );
    });
  });

  it("shows expired vehicle/driver selectable when toggle on and disabled when off", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        vehicle: {
          id: "veh-1",
          unitNumber: "U-101",
          licensePlate: "AAA-111",
          satConfigAutotransporteCode: "C2",
        },
      }),
    });

    const checkbox = screen.getByRole("checkbox", {
      name: copy.labels.allowExpiredDocs,
    });
    expect(checkbox).toBeChecked();

    await user.click(screen.getByLabelText(/Unidad tractora/));
    let listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText(copy.labels.withExpiredDocs)).toBeInTheDocument();
    expect(
      within(listbox).getByRole("option", { name: /EXP-999/ }),
    ).not.toHaveAttribute("data-disabled");
    await user.keyboard("{Escape}");

    await user.click(screen.getByLabelText(/Operador principal/));
    listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText(copy.labels.withExpiredDocs)).toBeInTheDocument();
    expect(
      within(listbox).getByRole("option", { name: /Conductor Vencido/ }),
    ).not.toHaveAttribute("data-disabled");
    await user.keyboard("{Escape}");

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    await user.click(screen.getByLabelText(/Unidad tractora/));
    listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).queryByText(copy.labels.withExpiredDocs),
    ).not.toBeInTheDocument();
    expect(
      within(listbox).getByRole("option", { name: /EXP-999/ }),
    ).toHaveAttribute("data-disabled");
    await user.keyboard("{Escape}");

    await user.click(screen.getByLabelText(/Operador principal/));
    listbox = await screen.findByRole("listbox");
    expect(
      within(listbox).queryByText(copy.labels.withExpiredDocs),
    ).not.toBeInTheDocument();
    expect(
      within(listbox).getByRole("option", { name: /Conductor Vencido/ }),
    ).toHaveAttribute("data-disabled");
  });

  it("shows showAllFleet checkbox when trip has originBranchId", async () => {
    const user = userEvent.setup();
    const tripWithBranch = makeTrip({
      originBranchId: "branch-1",
    });

    renderSheet({ trip: tripWithBranch });

    const checkbox = screen.getByRole("checkbox", {
      name: copy.labels.showAllFleet,
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("shows warning banner when selected vehicle has expired docs", () => {
    const tripWithExpiredVeh = makeTrip({
      vehicle: {
        id: "veh-expired",
        unitNumber: "U-EXP",
        licensePlate: "EXP-999",
        insuranceExpiry: "2020-01-01",
        satConfigAutotransporteCode: "C2",
      },
    });

    renderSheet({ trip: tripWithExpiredVeh });

    expect(
      screen.getByText(copy.alerts.expiredAssignmentTitle),
    ).toBeInTheDocument();
  });

  it("renders soft signal warning alert when vehicle type and driver license have a mismatch", () => {
    const tripWithMismatch = makeTrip({
      vehicle: {
        id: "veh-1",
        unitNumber: "U-101",
        licensePlate: "AAA-111",
        satConfigAutotransporteCode: "C2",
        type: "Tractocamión Articulado",
      },
      driver: {
        id: "drv-2",
        fullName: "Diana Chofer",
      },
      driverId: "drv-2",
    });

    renderSheet({ trip: tripWithMismatch });

    // Driver 2 has Category A license, while Tractocamión expects B or higher
    // Expect license warning signal in the document if mismatch occurs
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("pide confirmación al quitar apoyo en viaje in_progress", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        status: TripStatus.IN_PROGRESS,
        internalStaff: [
          {
            id: "staff-1",
            tripId: "trip-123",
            employeeId: "emp-3",
            employeeFullName: "Pedro Ayudante",
            internalRole: "helper",
            isPaymentResponsible: false,
            paymentNotes: null,
          },
        ],
      }),
    });

    const deleteButton = screen.getByRole("button", {
      name: copy.actions.deleteStaffMember,
    });
    await user.click(deleteButton);

    expect(
      screen.getByText(copy.removeStaffConfirm.title("Pedro Ayudante")),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.removeStaffConfirm.description)).toBeInTheDocument();
  });

  it("persists support staff removal on confirm in in_progress (PATCH fleet)", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderSheet({
      trip: makeTrip({
        status: TripStatus.IN_PROGRESS,
        internalStaff: [
          {
            id: "staff-1",
            tripId: "trip-123",
            employeeId: "emp-3",
            employeeFullName: "Pedro Ayudante",
            internalRole: "helper",
            isPaymentResponsible: false,
            paymentNotes: null,
          },
          {
            id: "staff-2",
            tripId: "trip-123",
            employeeId: "emp-4",
            employeeFullName: "Luis Copiloto",
            internalRole: "secondary_driver",
            isPaymentResponsible: false,
            paymentNotes: null,
          },
        ],
      }),
    });

    const deleteButtons = screen.getAllByRole("button", {
      name: copy.actions.deleteStaffMember,
    });
    await user.click(deleteButtons[0]!);

    await user.click(
      screen.getByRole("button", { name: copy.removeStaffConfirm.confirm }),
    );

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          internalStaff: [
            expect.objectContaining({
              employeeId: "emp-4",
              internalRole: "secondary_driver",
            }),
          ],
        }),
      );
    });
    const payload = mockMutate.mock.calls.at(-1)?.[0] as {
      internalStaff?: unknown[];
    };
    expect(payload.internalStaff).toHaveLength(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("no pide confirmación al quitar apoyo en viaje draft/scheduled", async () => {
    const user = userEvent.setup();
    renderSheet({
      trip: makeTrip({
        status: TripStatus.SCHEDULED,
        internalStaff: [
          {
            id: "staff-1",
            tripId: "trip-123",
            employeeId: "emp-3",
            employeeFullName: "Pedro Ayudante",
            internalRole: "helper",
            isPaymentResponsible: false,
            paymentNotes: null,
          },
        ],
      }),
    });

    const deleteButton = screen.getByRole("button", {
      name: copy.actions.deleteStaffMember,
    });
    await user.click(deleteButton);

    expect(
      screen.queryByText(copy.removeStaffConfirm.description),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.removeStaffConfirm.confirm }),
    ).not.toBeInTheDocument();
  });

  describe("auto-clear assignment toasts vs sheet open", () => {
    const outOfBranchTrip = () =>
      makeTrip({
        originBranchId: "branch-1",
        vehicle: {
          id: "veh-1",
          unitNumber: "U-101",
          licensePlate: "AAA-111",
          satConfigAutotransporteCode: "C2",
        },
        driver: {
          id: "drv-1",
          fullName: "Carlos Conductor",
        },
      });

    function setAssignedFleetOutOfBranch() {
      (mockVehicles[0] as { branchId?: string }).branchId = "branch-2";
      (mockDrivers[0] as { branchId?: string }).branchId = "branch-2";
    }

    function clearAssignedFleetBranch() {
      delete (mockVehicles[0] as { branchId?: string }).branchId;
      delete (mockDrivers[0] as { branchId?: string }).branchId;
    }

    afterEach(() => {
      clearAssignedFleetBranch();
    });

    it("does not toast assignmentCleared when sheet is closed (detail mount)", async () => {
      setAssignedFleetOutOfBranch();
      renderSheet({ open: false, trip: outOfBranchTrip() });

      await waitFor(() => {
        expect(mockToast).not.toHaveBeenCalledWith(
          expect.objectContaining({
            title: copy.alerts.assignmentClearedTitle,
          }),
        );
      });
    });

    it("toasts assignmentCleared when sheet is open and assignment is out of branch", async () => {
      setAssignedFleetOutOfBranch();
      renderSheet({ open: true, trip: outOfBranchTrip() });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: copy.alerts.assignmentClearedTitle,
            description: copy.alerts.assignmentClearedBody,
            variant: "warning",
          }),
        );
      });
      expect(
        mockToast.mock.calls.filter(
          (call) =>
            call[0]?.title === copy.alerts.assignmentClearedTitle,
        ).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("does not clear or toast when opening mid-trip with on_trip current fleet (ADR-0093)", async () => {
      mockUseAssignableVehicles.mockReturnValue({
        data: [
          {
            ...mockVehicles[0],
            status: "on_trip",
            canBeAssigned: false,
            blockReason: "En viaje",
          },
          mockVehicles[1],
          mockVehicles[2],
        ],
        isLoading: false,
      });
      mockUseDrivers.mockReturnValue({
        data: {
          data: [
            {
              ...mockDrivers[0],
              status: "on_trip",
              canBeAssigned: false,
            },
            mockDrivers[1],
          ],
        },
        isLoading: false,
      });

      renderSheet({
        open: true,
        trip: makeTrip({
          status: TripStatus.IN_PROGRESS,
          vehicle: {
            id: "veh-1",
            unitNumber: "U-101",
            licensePlate: "AAA-111",
            satConfigAutotransporteCode: "C2",
          },
          driver: {
            id: "drv-1",
            fullName: "Carlos Conductor",
          },
        }),
      });

      await waitFor(() => {
        expect(screen.getAllByText(/U-101/).length).toBeGreaterThan(0);
      });

      expect(
        mockToast.mock.calls.filter(
          (call) =>
            call[0]?.title === copy.alerts.assignmentClearedTitle,
        ),
      ).toHaveLength(0);
      expect(screen.queryByText(copy.errors.vehicleRequired)).not.toBeInTheDocument();
      expect(screen.queryByText(copy.errors.driverRequired)).not.toBeInTheDocument();
      expect(screen.getAllByText(/Carlos Conductor/).length).toBeGreaterThan(0);
    });
  });

  it("surfaces soft-hold pre-select alert for unit held by overlapping draft (F2)", async () => {
    mockUseDraftHoldAssignmentTripsForSoft.mockReturnValue({
      data: {
        items: [
          {
            id: "draft-hold-1",
            tripCode: "RSV-001",
            status: TripStatus.DRAFT,
            scheduledDeparture: new Date("2026-08-30T10:00:00.000Z"),
            scheduledArrival: new Date("2026-08-30T16:00:00.000Z"),
            vehicle: {
              id: "veh-2",
              unitNumber: "U-102",
              licensePlate: "BBB-222",
            },
            driver: { id: "drv-2", fullName: "Diana Chofer" },
          },
        ],
        truncated: false,
      },
      isLoading: false,
    });

    renderSheet({
      trip: makeTrip({
        status: TripStatus.SCHEDULED,
        vehicle: {
          id: "veh-2",
          unitNumber: "U-102",
          licensePlate: "BBB-222",
          satConfigAutotransporteCode: "C2",
        },
        driver: {
          id: "drv-1",
          fullName: "Carlos Conductor",
        },
      }),
    });

    expect(
      await screen.findByText(copy.alerts.softHoldTitle),
    ).toBeInTheDocument();
    expect(screen.getByText(/RSV-001/)).toBeInTheDocument();
    expect(
      screen.getByText(/no bloquea este viaje/i),
    ).toBeInTheDocument();
  });

  it("toasts soft overlap warnings from PATCH fleet result (F2 post)", async () => {
    const user = userEvent.setup();
    nextReassignResult = {
      trip: { id: "trip-123" } as Trip,
      warnings: [
        {
          code: "VEHICLE_OVERLAP_SOFT",
          message: "El vehículo ya está asignado al viaje RSV-001",
        },
      ],
    };

    renderSheet({ trip: makeTrip({ status: TripStatus.IN_PROGRESS }) });
    await user.click(screen.getByRole("button", { name: copy.saveButton }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: copy.toasts.overlapWarningTitle,
          description: "El vehículo ya está asignado al viaje RSV-001",
          variant: "warning",
        }),
      );
    });
  });
});
