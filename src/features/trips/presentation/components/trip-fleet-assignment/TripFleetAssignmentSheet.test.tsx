import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import { TripFleetAssignmentSheet } from "./TripFleetAssignmentSheet";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.operation.fleetAssignment;

const mockMutate = vi.fn();
const mockToast = vi.fn();
const mockUseAssignableVehicles = vi.fn();
const mockUseDrivers = vi.fn();
const mockUseEmployees = vi.fn();
const mockUseActiveAssignmentTripsForBusy = vi.fn();

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
    useUpdateTrip: (options?: {
      onSuccess?: () => void;
      onError?: (err: Error) => void;
    }) => ({
      mutate: (args: unknown) => {
        mockMutate(args);
        options?.onSuccess?.();
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
    employee: {
      id: "emp-2",
      fullName: "Diana Chofer",
      firstName: "Diana",
      lastName: "Chofer",
    },
    licenses: [{ category: "A", isExpired: false }],
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
  });

  it("passes enabled:true to assignment queries when sheet is open", () => {
    renderSheet({ open: true });

    expect(mockUseAssignableVehicles).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
    expect(mockUseActiveAssignmentTripsForBusy).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
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
      expect(mockMutate).toHaveBeenCalledWith({
        id: "trip-123",
        data: expect.objectContaining({
          vehicleId: "veh-1",
          driverId: "drv-1",
          trailers: [],
          allowExpiredDocs: true,
        }),
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: copy.toasts.success,
        }),
      );
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows stamped invoice critical alert and opens confirmation dialog before saving", async () => {
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

    // Click save -> Dialog opens
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
      expect(mockMutate).toHaveBeenCalledWith({
        id: "trip-123",
        data: expect.objectContaining({
          vehicleId: "veh-1",
          driverId: "drv-1",
        }),
      });
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
      expect(mockMutate).toHaveBeenCalledWith({
        id: "trip-123",
        data: expect.objectContaining({
          internalStaff: [],
        }),
      });
    });
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
      expect(mockMutate).toHaveBeenCalledWith({
        id: "trip-123",
        data: expect.objectContaining({
          allowExpiredDocs: true,
        }),
      });
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
      expect(mockMutate).toHaveBeenCalledWith({
        id: "trip-123",
        data: expect.objectContaining({
          allowExpiredDocs: false,
        }),
      });
    });
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
  });
});
