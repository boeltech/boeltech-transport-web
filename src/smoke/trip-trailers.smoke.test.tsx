/**
 * Smoke ADR-0077 — remolques en asignación de viaje (pool + snapshot).
 * Mock de API; no requiere backend ni PAC.
 *
 * Happy path UI:
 * - Config S/R → muestra selects de remolque
 * - Config no S/R → no muestra remolques
 * - Detalle muestra placa snapshot RO
 * - VehicleForm cutover deep-link a /trailers
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TripStatus, type Trip } from "@features/trips/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import { TripTrailerAssignmentFields } from "@features/trips/presentation/pages/create/components/TripTrailerAssignmentFields";
import { TripDetailOperationTab } from "@features/trips/presentation/components/trip-operation";
import { VehicleForm } from "@features/vehicles/presentation/components/VehicleForm";
import {
  defaultWizardFormValues,
  type TripWizardFormValues,
} from "@features/trips/presentation/pages/create/components/validation";
import { buildCreateTripInputFromWizardValues } from "@features/trips/presentation/pages/create/wizardToCreateTripInput";
import { deepToSnake } from "@shared/api/utils/case-transformer";

const VEHICLE_SR_ID = "11111111-1111-4111-8111-111111111111";
const VEHICLE_C2_ID = "22222222-2222-4222-8222-222222222222";
const TRAILER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const DRIVER_ID = "33333333-3333-4333-8333-333333333333";

vi.mock("@features/trailers", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/trailers")>();
  return {
    ...actual,
    useAssignableTrailers: () => ({
      data: [
        {
          id: TRAILER_ID,
          tenantId: "tenant-1",
          licensePlate: "REM1234",
          satSubTipoRemCode: "CTR001",
          status: "available",
          branchId: null,
          isActive: true,
          notes: null,
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
          createdBy: null,
          updatedBy: null,
          canBeAssigned: true,
        },
      ],
      isLoading: false,
    }),
    CreateTrailerSheet: () => null,
  };
});

vi.mock("@features/billing", () => ({
  useInternalStaffEntitlement: () => ({
    hasModule: true,
    isFetched: true,
  }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({
    data: { data: [], meta: undefined },
    isLoading: false,
  }),
}));

vi.mock("@features/catalogs", () => ({
  TipoPermisoSelect: () => <div data-testid="mock-tipo-permiso" />,
  ConfigAutotransporteSelect: () => <div data-testid="mock-config" />,
  SubTipoRemSelect: () => <div data-testid="mock-subtipo" />,
}));

vi.mock(
  "@features/trips/presentation/components/trip-operation/TripScheduleInlineEditor",
  () => ({
    TripScheduleInlineEditor: () => null,
  }),
);

function TestProviders({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function makeVehicle(
  overrides: Partial<AssignableVehicleItem> &
    Pick<AssignableVehicleItem, "id" | "satConfigAutotransporteCode">,
): AssignableVehicleItem {
  return {
    unitNumber: "U-001",
    licensePlate: "ABC1234",
    brand: "Freightliner",
    model: "Cascadia",
    year: 2022,
    type: "truck",
    color: null,
    status: "available",
    currentMileage: 0,
    isActive: true,
    insurancePolicy: "POL-1",
    insuranceExpiry: "2030-01-01",
    sctPermitNumber: "SCT-1",
    sctPermitExpiry: "2030-01-01",
    satTipoPermisoCode: "TPAF01",
    pesoBrutoVehicular: 25,
    insuranceCompany: "GNP",
    remolques: [],
    branchId: null,
    branchName: null,
    branchCode: null,
    canBeAssigned: true,
    ...overrides,
  };
}

function TrailerFieldsHarness({
  vehicleId,
  vehicles,
}: {
  vehicleId: string;
  vehicles: AssignableVehicleItem[];
}) {
  const form = useForm<TripWizardFormValues>({
    defaultValues: {
      ...defaultWizardFormValues,
      vehicleId,
      driverId: DRIVER_ID,
      trailers: [],
      satConfigAutotransporteCode: "",
    } as TripWizardFormValues,
  });
  return (
    <FormProvider {...form}>
      <TripTrailerAssignmentFields form={form} vehicles={vehicles} />
    </FormProvider>
  );
}

function makeTripWithTrailers(): Trip {
  return {
    id: "trip-smoke-trailers-1",
    tenantId: "tenant-1",
    tripCode: "VJ-TRL-001",
    status: TripStatus.DRAFT,
    vehicleId: VEHICLE_SR_ID,
    driverId: DRIVER_ID,
    clientId: null,
    originBranchId: null,
    scheduledDeparture: new Date("2030-01-15T20:00:00.000Z"),
    scheduledArrival: null,
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: 1000, end: null },
    originCity: "QRO",
    originState: null,
    destinationCity: "CDMX",
    destinationState: null,
    cargo: {
      description: null,
      weight: null,
      volume: null,
      units: null,
      value: null,
    },
    costs: {
      baseRate: 0,
      fuelCost: 0,
      tollCost: 0,
      otherCosts: 0,
      totalCost: 0,
    },
    detailedCosts: null,
    profitability: null,
    notes: null,
    cancellationReason: null,
    cfdiDocumentIntent: "ingreso",
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    createdBy: null,
    updatedBy: null,
    vehicle: {
      id: VEHICLE_SR_ID,
      unitNumber: "U-SR",
      licensePlate: "ABC1234",
    },
    driver: { id: DRIVER_ID, fullName: "Conductor Smoke" },
    trailers: [
      {
        trailerId: TRAILER_ID,
        position: 1,
        satSubTipoRemCode: "CTR001",
        licensePlate: "REM1234",
        snapshotAt: "2026-08-01T12:00:00.000Z",
      },
    ],
  } as Trip;
}

describe("smoke ADR-0077 trip trailers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows remolque selects when unit Config is S/R", () => {
    const vehicles = [
      makeVehicle({
        id: VEHICLE_SR_ID,
        satConfigAutotransporteCode: "T3S2",
      }),
    ];
    render(
      <TestProviders>
        <TrailerFieldsHarness vehicleId={VEHICLE_SR_ID} vehicles={vehicles} />
      </TestProviders>,
    );
    expect(screen.getByText(/Remolques \(Config S\/R\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Remolque 1/i)).toBeInTheDocument();
  });

  it("hides remolque selects when unit Config is not S/R", () => {
    const vehicles = [
      makeVehicle({
        id: VEHICLE_C2_ID,
        satConfigAutotransporteCode: "C2",
      }),
    ];
    render(
      <TestProviders>
        <TrailerFieldsHarness vehicleId={VEHICLE_C2_ID} vehicles={vehicles} />
      </TestProviders>,
    );
    expect(screen.queryByText(/Remolques \(Config S\/R\)/i)).not.toBeInTheDocument();
  });

  it("shows trailer plate snapshot on trip detail (read-only)", () => {
    render(
      <TestProviders>
        <TripDetailOperationTab
          trip={makeTripWithTrailers()}
          canEditStructural={false}
          showMileage={false}
        />
      </TestProviders>,
    );
    expect(screen.getByText(/Remolques \(snapshot\)/i)).toBeInTheDocument();
    expect(screen.getByText(/REM1234/)).toBeInTheDocument();
    expect(screen.getByText(/CTR001/)).toBeInTheDocument();
  });

  it("VehicleForm cutover links to /trailers", () => {
    render(
      <TestProviders>
        <VehicleForm
          onSubmit={() => undefined}
          onCancel={() => undefined}
          wizardMode
          wizardStepIndex={2}
        />
      </TestProviders>,
    );
    const link = screen.getByRole("link", { name: /Flota → Remolques/i });
    expect(link).toHaveAttribute("href", "/trailers");
  });

  it("reserve payload includes trailers snake_case for S/R", () => {
    const values = {
      ...defaultWizardFormValues,
      vehicleId: VEHICLE_SR_ID,
      driverId: DRIVER_ID,
      clientId: "44444444-4444-4444-8444-444444444444",
      scheduledDeparture: "2030-01-15T14:00",
      startMileage: 12000,
      originCity: "CDMX",
      destinationCity: "MTY",
      satConfigAutotransporteCode: "T3S2",
      trailers: [{ trailerId: TRAILER_ID, position: 1 as const }],
      cfdiDocumentIntent: "ingreso" as const,
      stops: [],
      cargos: [],
      expenses: [],
      internalStaff: [],
    } as unknown as TripWizardFormValues;

    const payload = buildCreateTripInputFromWizardValues(values, undefined, {
      createIntent: "reserve",
    });
    expect(payload.trailers).toEqual([
      { trailerId: TRAILER_ID, position: 1 },
    ]);

    const snake = deepToSnake(payload) as {
      trailers?: Array<{ trailer_id: string; position: number }>;
    };
    expect(snake.trailers?.[0]?.trailer_id).toBe(TRAILER_ID);
  });
});
