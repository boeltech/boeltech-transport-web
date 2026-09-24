import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import {
  TripStatus,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";
import { tripDetailCopy } from "../../copy";
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
import type { TripCargoFormValues } from "../../pages/create/components/validation";
import { TripDetailCargoTab } from "./TripDetailCargoTab";

const mutateAddAsync = vi.fn();
const mutateUpdateAsync = vi.fn();
const mutateDelete = vi.fn();
const mutateReassignAsync = vi.fn();

const { mockUseVehicle } = vi.hoisted(() => ({
  mockUseVehicle: vi.fn(() => ({
    data: undefined as
      | {
          unitNumber: string;
          brand: string;
          model: string;
          capacities: { loadCapacity: number | null };
        }
      | undefined,
    isLoading: false,
  })),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
  useMediaQuery: () => false,
}));

vi.mock("@features/vehicles", () => ({
  useVehicle: (...args: unknown[]) => mockUseVehicle(...args),
}));

vi.mock("@features/trips/application", () => ({
  useAddCargo: () => ({
    mutate: vi.fn(),
    mutateAsync: mutateAddAsync,
    isPending: false,
  }),
  useUpdateCargo: () => ({
    mutate: vi.fn(),
    mutateAsync: mutateUpdateAsync,
    isPending: false,
  }),
  useDeleteCargo: () => ({ mutate: mutateDelete, isPending: false }),
  useReassignCargoMovementStop: () => ({
    mutate: vi.fn(),
    mutateAsync: mutateReassignAsync,
    isPending: false,
  }),
}));

vi.mock("../../pages/create/components/CargoMovementSheet", () => ({
  CargoMovementSheet: ({
    open,
    initialValues,
    editingIndex,
    deliveriesReadOnly,
    availablePickupStops,
    onPickupStopChange,
    vehicleCapacityKg,
    onSubmit,
  }: {
    open: boolean;
    initialValues: { description?: string; satProductCode?: string } | null;
    editingIndex: number | null;
    deliveriesReadOnly?: boolean;
    availablePickupStops?: Array<{ index: number; locationName?: string }>;
    onPickupStopChange?: (stop: {
      index: number;
      address: string;
      city: string;
    }) => void;
    vehicleCapacityKg?: number | null;
    onSubmit: (
      values: TripCargoFormValues,
      editingIndex: number | null,
      options?: { keepOpen?: boolean },
    ) => void | Promise<void>;
  }) =>
    open ? (
      <div data-testid="cargo-movement-sheet">
        <span data-testid="sheet-mode">
          {editingIndex !== null ? "edit" : "create"}
        </span>
        <span data-testid="sheet-deliveries-readonly">
          {deliveriesReadOnly ? "readonly" : "editable"}
        </span>
        <span data-testid="sheet-pickup-options">
          {availablePickupStops?.length ?? 0}
        </span>
        <span data-testid="sheet-vehicle-capacity">
          {vehicleCapacityKg == null ? "null" : String(vehicleCapacityKg)}
        </span>
        {onPickupStopChange && (availablePickupStops?.length ?? 0) > 1 ? (
          <button
            type="button"
            data-testid="sheet-change-pickup"
            onClick={() =>
              onPickupStopChange({
                index: 1,
                address: "Escala",
                city: "Querétaro",
              })
            }
          >
            change-pickup
          </button>
        ) : null}
        <span data-testid="sheet-description">
          {initialValues?.description ?? ""}
        </span>
        <span data-testid="sheet-sat">
          {initialValues?.satProductCode ?? ""}
        </span>
        <button
          type="button"
          data-testid="sheet-submit-create"
          onClick={() =>
            void onSubmit(
              {
                description: "Harina y productos de molinos",
                satProductCode: "50221300",
                satProductDescription: "Harina y productos de molinos",
                satUnitCode: "X8A",
                satUnitName: "Pallet de madera",
                currency: "MXN",
                weight: 20000,
                units: 20,
                weightInKg: 20000,
                hazardousMaterial: false,
                requiresHazmat: false,
                isInsured: false,
                sectorRequirements: {},
                movements: [{ stopIndex: 0, movementType: "pickup" }],
              } as TripCargoFormValues,
              null,
            )
          }
        >
          Submit create
        </button>
        <button
          type="button"
          data-testid="sheet-submit-edit"
          onClick={() =>
            void onSubmit(
              {
                description: "Tarimas de acero",
                satProductCode: "50192100",
                satUnitCode: "H87",
                satUnitName: "Pieza",
                currency: "MXN",
                weight: 200,
                units: 4,
                weightInKg: 200,
                hazardousMaterial: false,
                requiresHazmat: false,
                isInsured: false,
                sectorRequirements: {},
                movements: [{ stopIndex: 0, movementType: "pickup" }],
              } as TripCargoFormValues,
              0,
            )
          }
        >
          Submit edit
        </button>
      </div>
    ) : null,
}));

const copy = tripDetailCopy.cargo;

const pickupStop = {
  id: "st-1",
  stopType: ["pickup"],
  address: "Bodega 1",
  city: "Monterrey",
  state: "NL",
  locationName: "Bodega",
  sequenceOrder: 0,
} as TripStop;

const sampleCargo = {
  id: "cargo-1",
  description: "Tarimas de acero",
  status: "pending",
  weight: 200,
  weightInKg: 200,
  units: 4,
  declaredValue: 1000,
  satProductCode: "50192100",
  satUnitCode: "H87",
  satUnitName: "Pieza",
  aseguraCarga: "Qualitas",
  polizaCarga: "POL-1",
  hazardousMaterial: false,
  requiresHazmat: false,
  movements: [
    {
      id: "mov-pickup-1",
      stopId: "st-1",
      stopIndex: 0,
      movementType: "pickup",
      weight: 200,
      units: 4,
      completedAt: null,
      notes: null,
    },
  ],
  notes: null,
  client: undefined,
  pickedUpAt: null,
  deliveredAt: null,
  volume: null,
} as TripCargo;

describe("TripDetailCargoTab", () => {
  beforeEach(() => {
    mutateAddAsync.mockReset();
    mutateUpdateAsync.mockReset();
    mutateReassignAsync.mockReset();
    mutateDelete.mockClear();
    mutateAddAsync.mockResolvedValue({});
    mutateUpdateAsync.mockResolvedValue({});
    mutateReassignAsync.mockResolvedValue({});
    mockUseVehicle.mockReset();
    mockUseVehicle.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("shows empty without pickup and no add-cargo CTA", () => {
    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.DRAFT}
          cargos={[]}
          orderedStops={[]}
          pickupStops={[]}
          isLoading={false}
          isError={false}
          canEditStructural
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(copy.state.emptyNoPickupTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.action.addCargo }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.action.goToRoute }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/edición completa/i)).not.toBeInTheDocument();
  });

  it("shows add-cargo CTA when a pickup stop exists", () => {
    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.DRAFT}
          cargos={[]}
          orderedStops={[pickupStop]}
          pickupStops={[pickupStop]}
          isLoading={false}
          isError={false}
          canEditStructural
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: copy.action.addCargo }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.state.emptyDescription)).toBeInTheDocument();
    expect(copy.state.emptyDescription).not.toMatch(/timbrar|carta porte|sat/i);
  });

  it("shows sin_cfdi empty advisory when emission intent is sin_cfdi_efectivo", () => {
    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.SCHEDULED}
          cargos={[]}
          orderedStops={[pickupStop]}
          pickupStops={[pickupStop]}
          isLoading={false}
          isError={false}
          canEditStructural
          cfdiEmissionIntent="sin_cfdi_efectivo"
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(cfdiEmissionIntentCopy.cargoGate.emptyTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(cfdiEmissionIntentCopy.cargoGate.emptyBody),
    ).toBeInTheDocument();
    expect(
      screen.getByText(cfdiEmissionIntentCopy.cargoGate.emptyHint),
    ).toBeInTheDocument();
    expect(screen.queryByText(copy.state.emptyDescription)).not.toBeInTheDocument();
  });

  it("opens edit sheet from read panel with deliveries read-only", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.DRAFT}
          cargos={[sampleCargo]}
          orderedStops={[pickupStop]}
          pickupStops={[pickupStop]}
          isLoading={false}
          isError={false}
          canEditStructural
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Tarimas de acero").length).toBeGreaterThan(0);
    expect(screen.queryByText(/50192100/)).not.toBeInTheDocument();
    expect(screen.queryByText(/H87/)).not.toBeInTheDocument();
    // Insurance is on the read panel when insured — not SAT codes
    expect(screen.queryByText(/50192100|ClaveProdServ|CFDI/i)).not.toBeInTheDocument();
    expect(screen.getByText(copy.format.metaLine(1, 200))).toBeInTheDocument();
    expect(screen.getByText(copy.section.route)).toBeInTheDocument();
    expect(
      screen.getAllByText(copy.format.quantitiesLine(["200 kg", "4 uds"]))
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(copy.hint.manageInTracking)).toBeInTheDocument();
    expect(screen.queryByText(copy.section.list)).toBeInTheDocument();
    expect(screen.queryByText(/Por estado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Resumen de cargas/i)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.action.editCargo }),
    );

    expect(screen.getByTestId("cargo-movement-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("sheet-mode")).toHaveTextContent("edit");
    expect(screen.getByTestId("sheet-deliveries-readonly")).toHaveTextContent(
      "readonly",
    );
    expect(screen.getByTestId("sheet-description")).toHaveTextContent(
      "Tarimas de acero",
    );
    expect(screen.getByTestId("sheet-sat")).toHaveTextContent("50192100");
  });

  it("submits create cargo with stopId from orderedStops and editable deliveries", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.DRAFT}
          cargos={[]}
          orderedStops={[pickupStop]}
          pickupStops={[pickupStop]}
          isLoading={false}
          isError={false}
          canEditStructural
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: copy.action.addCargo }),
    );
    expect(screen.getByTestId("sheet-deliveries-readonly")).toHaveTextContent(
      "editable",
    );
    await user.click(screen.getByTestId("sheet-submit-create"));

    await waitFor(() => {
      expect(mutateAddAsync).toHaveBeenCalledTimes(1);
    });
    expect(mutateAddAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Harina y productos de molinos",
        movements: [
          expect.objectContaining({
            stopIndex: 0,
            movementType: "pickup",
            stopId: "st-1",
          }),
        ],
      }),
    );
  });

  it("passes pickup options in edit and PATCHes reassign before PUT update", async () => {
    const user = userEvent.setup();
    const waypointPickup = {
      id: "st-wp",
      stopType: ["waypoint", "pickup"],
      address: "Escala 1",
      city: "Querétaro",
      state: "QUE",
      locationName: "Escala Norte",
      sequenceOrder: 1,
    } as TripStop;
    const destination = {
      id: "st-dest",
      stopType: ["destination", "delivery"],
      address: "CEDIS",
      city: "Monterrey",
      state: "NL",
      locationName: "Destino",
      sequenceOrder: 2,
    } as TripStop;

    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.DRAFT}
          cargos={[sampleCargo]}
          orderedStops={[pickupStop, waypointPickup, destination]}
          pickupStops={[pickupStop, waypointPickup]}
          isLoading={false}
          isError={false}
          canEditStructural
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: copy.action.editCargo }),
    );

    expect(screen.getByTestId("sheet-pickup-options")).toHaveTextContent("2");
    await user.click(screen.getByTestId("sheet-change-pickup"));
    await user.click(screen.getByTestId("sheet-submit-edit"));

    await waitFor(() => {
      expect(mutateReassignAsync).toHaveBeenCalledTimes(1);
    });
    expect(mutateReassignAsync).toHaveBeenCalledWith({
      cargoId: "cargo-1",
      movementId: "mov-pickup-1",
      data: { stopId: "st-wp", stopIndex: 1 },
    });
    expect(mutateUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it("shows meta without captured weight when cargos have zero kg", () => {
    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.DRAFT}
          cargos={[
            {
              ...sampleCargo,
              weight: 0,
              weightInKg: 0,
            },
          ]}
          orderedStops={[pickupStop]}
          pickupStops={[pickupStop]}
          isLoading={false}
          isError={false}
          canEditStructural
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(copy.format.metaLine(1, 0)),
    ).toBeInTheDocument();
    expect(copy.format.metaLine(1, 0)).toContain("sin peso capturado");
  });

  it("shows capacity strip and wires vehicleCapacityKg to the sheet", async () => {
    const user = userEvent.setup();
    mockUseVehicle.mockReturnValue({
      data: {
        unitNumber: "ECO-1",
        brand: "Kenworth",
        model: "T680",
        capacities: { loadCapacity: 20 },
      },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.IN_PROGRESS}
          cargos={[sampleCargo]}
          orderedStops={[pickupStop]}
          pickupStops={[pickupStop]}
          isLoading={false}
          isError={false}
          canEditStructural={false}
          canAppendCargo
          vehicleId="veh-1"
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(copy.capacity.title)).toBeInTheDocument();
    expect(
      screen.getByText(copy.capacity.vehicleSubtitle("ECO-1", "Kenworth", "T680")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        copy.capacity.loadedOfCapacity(
          copy.capacity.formatWeight(200),
          copy.capacity.formatWeight(20_000),
        ),
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.action.addCargo }),
    );
    expect(screen.getByTestId("sheet-vehicle-capacity")).toHaveTextContent(
      "20000",
    );
  });

  it("uses readonly over-capacity hint when the trip is completed", () => {
    mockUseVehicle.mockReturnValue({
      data: {
        unitNumber: "ECO-1",
        brand: "Kenworth",
        model: "T680",
        capacities: { loadCapacity: 20 },
      },
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <TripDetailCargoTab
          tripId="trip-1"
          tripStatus={TripStatus.COMPLETED}
          cargos={[
            {
              ...sampleCargo,
              weight: 25_000,
              weightInKg: 25_000,
            },
          ]}
          orderedStops={[pickupStop]}
          pickupStops={[pickupStop]}
          isLoading={false}
          isError={false}
          canEditStructural={false}
          vehicleId="veh-1"
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(copy.capacity.overCapacityHintReadonly),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(copy.capacity.overCapacityHint),
    ).not.toBeInTheDocument();
  });
});
