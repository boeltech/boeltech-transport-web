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
import type { TripCargoFormValues } from "../../pages/create/components/validation";
import { TripDetailCargoTab } from "./TripDetailCargoTab";

const mutateAddAsync = vi.fn();
const mutateUpdateAsync = vi.fn();
const mutateDelete = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
  useMediaQuery: () => false,
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
}));

vi.mock("../../pages/create/components/CargoMovementSheet", () => ({
  CargoMovementSheet: ({
    open,
    initialValues,
    editingIndex,
    deliveriesReadOnly,
    onSubmit,
  }: {
    open: boolean;
    initialValues: { description?: string; satProductCode?: string } | null;
    editingIndex: number | null;
    deliveriesReadOnly?: boolean;
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
    mutateDelete.mockClear();
    mutateAddAsync.mockResolvedValue({});
    mutateUpdateAsync.mockResolvedValue({});
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
});
