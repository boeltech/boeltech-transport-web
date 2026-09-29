import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { wizardCopy } from "../../../copy";
import {
  CargoMovementSheet,
  type CargoSheetDeliveryStop,
  type CargoSheetPickupStop,
} from "./CargoMovementSheet";
import type { TripCargoFormValues } from "./validation";

const sheet = wizardCopy.cargo.sheet;

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({
      toast: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
    }),
  };
});

vi.mock("@shared/cfdi", () => ({
  fetchRegulatoryFlagsForSatProductCp: vi.fn().mockResolvedValue({
    requiresHazmat: false,
    sectorRequirements: {},
  }),
}));

vi.mock("@features/catalogs", () => ({
  ProductoServicioCPSearch: ({
    id,
    error,
    "aria-invalid": ariaInvalid,
  }: {
    id?: string;
    error?: boolean;
    "aria-invalid"?: boolean;
  }) => (
    <div
      data-testid="product-search"
      id={id}
      data-error={error ? "true" : "false"}
      aria-invalid={ariaInvalid || undefined}
    />
  ),
  UnidadMedidaSearch: () => <div data-testid="unit-search" />,
  MaterialPeligrosoSearch: () => <div data-testid="hazmat-search" />,
  TipoEmbalajeSelect: () => <div data-testid="packaging-select" />,
}));

const pickupStop: CargoSheetPickupStop = {
  index: 0,
  address: "Bodega 1",
  city: "Monterrey",
  state: "NL",
  locationName: "Bodega",
};

const deliveryStops: CargoSheetDeliveryStop[] = [
  {
    index: 1,
    address: "Cliente",
    city: "Apodaca",
    locationName: "Descarga",
  },
];

const validCargo: TripCargoFormValues = {
  description: "Harina y productos de molinos",
  satProductCode: "50221300",
  satProductDescription: "Harina y productos de molinos",
  satUnitCode: "X8A",
  satUnitName: "Pallet de madera",
  currency: "MXN",
  weight: 1000,
  units: 10,
  weightInKg: 1000,
  hazardousMaterial: false,
  requiresHazmat: false,
  isInsured: false,
  sectorRequirements: {},
  movements: [
    { stopIndex: 0, movementType: "pickup" },
    { stopIndex: 1, movementType: "delivery", weight: 500, units: 5 },
  ],
};

describe("CargoMovementSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps sheet open and disables submit while onSubmit is pending, then closes on success", async () => {
    const user = userEvent.setup();
    let resolveSubmit!: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const onOpenChange = vi.fn();

    render(
      <CargoMovementSheet
        open
        onOpenChange={onOpenChange}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={onSubmit}
      />,
    );

    const addButton = screen.getByRole("button", { name: sheet.action.add });
    await user.click(addButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(addButton).toBeDisabled();
    expect(
      screen.getByRole("button", { name: sheet.action.addAnother }),
    ).toBeDisabled();

    resolveSubmit();
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("stays open and does not reset when onSubmit rejects", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => Promise.reject(new Error("network")));
    const onOpenChange = vi.fn();

    render(
      <CargoMovementSheet
        open
        onOpenChange={onOpenChange}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: sheet.action.add }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: sheet.action.add }),
      ).not.toBeDisabled();
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByDisplayValue(validCargo.description)).toBeInTheDocument();
    expect(screen.getByText("network")).toBeInTheDocument();
  });

  it("resets form for keepOpen only after onSubmit resolves", async () => {
    const user = userEvent.setup();
    let resolveSubmit!: () => void;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const onOpenChange = vi.fn();

    render(
      <CargoMovementSheet
        open
        onOpenChange={onOpenChange}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: sheet.action.addAnother }),
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.any(Object),
        null,
        { keepOpen: true },
      );
    });
    expect(screen.getByDisplayValue(validCargo.description)).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    resolveSubmit();
    await waitFor(() => {
      expect(
        screen.queryByDisplayValue(validCargo.description),
      ).not.toBeInTheDocument();
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("hides delivery editors when deliveriesReadOnly", () => {
    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={0}
        deliveriesReadOnly
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: sheet.action.addDelivery }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(sheet.hint.deliveriesReadOnly)).toBeInTheDocument();
    expect(
      screen.getByText(
        sheet.format.deliveryStopOption(1, "Descarga", "Cliente", "Apodaca"),
      ),
    ).toBeInTheDocument();
  });

  it("shows FormValidationSummary when submit is invalid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={null}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: sheet.action.add }));

    await waitFor(() => {
      expect(
        screen.getByText(sheet.validation.missingRequiredTitle),
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByText("Selecciona el producto de transporte").length,
    ).toBeGreaterThanOrEqual(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submit when a delivery row has no stop selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: sheet.action.addDelivery }),
    );
    await user.click(screen.getByRole("button", { name: sheet.action.add }));

    await waitFor(() => {
      expect(
        screen.getAllByText(sheet.validation.deliveryStopRequired).length,
      ).toBeGreaterThanOrEqual(1);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows short satUnitCode beside Cantidad even when satUnitName is long (XPB)", async () => {
    const user = userEvent.setup();
    const longUnitName =
      "Botella, protegida o no, de vidrio, de cualquier capacidad, con tapa de rosca o tapón a presión";
    const cargoWithLongUnitName: TripCargoFormValues = {
      ...validCargo,
      satUnitCode: "XPB",
      satUnitName: longUnitName,
    };
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={cargoWithLongUnitName}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={onSubmit}
      />,
    );

    const unitsSuffix = screen.getByTestId("cargo-units-suffix");
    expect(unitsSuffix).toHaveTextContent("XPB");
    expect(unitsSuffix).not.toHaveTextContent(longUnitName);
    expect(screen.queryByText(longUnitName)).not.toBeInTheDocument();

    const weightSpacer = screen.getByTestId("cargo-weight-suffix-spacer");
    expect(weightSpacer).toHaveTextContent("XPB");
    expect(weightSpacer).not.toHaveTextContent(longUnitName);

    const unitsInput = screen.getByRole("spinbutton", {
      name: (_content, element) => element.id === "cargo-units",
    });
    const weightInput = screen.getByRole("spinbutton", {
      name: (_content, element) => element.id === "cargo-weight-kg",
    });
    expect(unitsInput).toHaveClass("min-w-[4.5rem]");
    expect(weightInput).toHaveClass("min-w-[4.5rem]");

    fireEvent.change(unitsInput, { target: { value: "12" } });
    fireEvent.change(weightInput, { target: { value: "250" } });
    expect(unitsInput).toHaveValue(12);
    expect(weightInput).toHaveValue(250);

    await user.click(screen.getByRole("button", { name: sheet.action.add }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const submitted = onSubmit.mock.calls[0][0] as TripCargoFormValues;
    expect(submitted.satUnitCode).toBe("XPB");
    expect(submitted.satUnitName).toBe(longUnitName);
  });
  it("falls back to unidades when satUnitCode is empty", () => {
    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={{
          ...validCargo,
          satUnitCode: "",
          satUnitName: "",
        }}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId("cargo-units-suffix")).toHaveTextContent(
      "unidades",
    );
    expect(screen.getByTestId("cargo-weight-suffix-spacer")).toHaveTextContent(
      "unidades",
    );
  });
});
