import {
  classifyMaterialPeligrosoCatalogRequirement,
  extractCargoRegulatoryFlags,
  type MaterialPeligrosoCatalogRequirement,
} from "@boeltech/cfdi-domain";
import { StrictMode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { fetchRegulatoryFlagsForSatProductCp } from "@shared/cfdi";

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
    materialPeligrosoRequirement: "unknown",
  }),
}));

let pickedProduct: {
  code: string;
  name: string;
  metadata: Record<string, unknown> | null;
} = {
  code: "50202200",
  name: "Bebidas alcohólicas",
  metadata: { material_peligroso: "0,1" },
};

vi.mock("@features/catalogs", () => ({
  ProductoServicioCPSearch: ({
    id,
    error,
    "aria-invalid": ariaInvalid,
    onSelect,
  }: {
    id?: string;
    error?: boolean;
    "aria-invalid"?: boolean;
    onSelect?: (item: {
      code: string;
      name: string;
      metadata: Record<string, unknown> | null;
    }) => void;
  }) => (
    <div
      data-testid="product-search"
      id={id}
      data-error={error ? "true" : "false"}
      aria-invalid={ariaInvalid || undefined}
    >
      <button type="button" onClick={() => onSelect?.(pickedProduct)}>
        Elegir clave de prueba
      </button>
    </div>
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

function mockCatalogMark(requirement: MaterialPeligrosoCatalogRequirement) {
  vi.mocked(fetchRegulatoryFlagsForSatProductCp).mockResolvedValue({
    requiresHazmat: requirement === "declare_required_si",
    sectorRequirements: {},
    materialPeligrosoRequirement: requirement,
  });
}

/** C8: hazmat vive dentro de Requisitos plegado — abre la sección si hace falta. */
async function ensureRequirementsOpen(
  user: ReturnType<typeof userEvent.setup>,
) {
  // C5/C8: marca 1 / sector pueden abrir sola tras el fetch del catálogo.
  try {
    await screen.findByRole(
      "checkbox",
      { name: sheet.label.isHazmat },
      { timeout: 2000 },
    );
    return;
  } catch {
    // sigue a apertura manual
  }

  const trigger = screen.getByText(sheet.section.requirements).closest("button");
  expect(trigger).toBeTruthy();
  if (trigger?.getAttribute("data-state") === "open") {
    expect(
      await screen.findByRole("checkbox", { name: sheet.label.isHazmat }),
    ).toBeInTheDocument();
    return;
  }
  await user.click(trigger!);
  expect(
    await screen.findByRole("checkbox", { name: sheet.label.isHazmat }),
  ).toBeInTheDocument();
}

describe("CargoMovementSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pickedProduct = {
      code: "50202200",
      name: "Bebidas alcohólicas",
      metadata: { material_peligroso: "0,1" },
    };
    mockCatalogMark("unknown");
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

  it("C7.1: 1 descarga = fila solo lectura + hint; sin Agregar entrega", () => {
    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={0}
        allowAddDelivery={false}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: sheet.action.addDelivery }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(sheet.hint.deliveriesSingleUnload),
    ).toBeInTheDocument();
    expect(sheet.hint.deliveriesSingleUnload).toMatch(/registra/i);
    // Fila muted (puede repetirse en resumen whereOk); sin inputs editables.
    expect(screen.getAllByText(/2 · Descarga/).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByDisplayValue("500")).not.toBeInTheDocument();
  });

  it("C7.1: 1 descarga sin assignment muestra destino en fila muted", () => {
    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={{
          ...validCargo,
          movements: [{ stopIndex: 0, movementType: "pickup" }],
        }}
        editingIndex={null}
        allowAddDelivery={false}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/2 · Descarga/).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.queryByText(sheet.state.noDeliveriesSingleUnload),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(sheet.state.noDeliveries)).not.toBeInTheDocument();
  });

  it("shows Agregar entrega when allowAddDelivery and ≥2 descargas (C7)", () => {
    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={[
          ...deliveryStops,
          {
            index: 2,
            address: "Cliente 2",
            city: "Santa Catarina",
            locationName: "Descarga 2",
          },
        ]}
        initialValues={validCargo}
        editingIndex={0}
        allowAddDelivery
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: sheet.action.addDelivery }),
    ).toBeInTheDocument();
  });

  it("blocks save with ≥2 unload stops and 0 deliveries (F5d-c hard)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const multiUnloadStops: CargoSheetDeliveryStop[] = [
      deliveryStops[0]!,
      {
        index: 2,
        address: "Cliente 2",
        city: "Guadalupe",
        locationName: "Descarga 2",
      },
    ];

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={multiUnloadStops}
        initialValues={{
          ...validCargo,
          movements: [{ stopIndex: 0, movementType: "pickup" }],
        }}
        editingIndex={null}
        allowAddDelivery
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByText(sheet.state.noDeliveriesMultiUnload),
    ).toBeInTheDocument();
    expect(screen.queryByText(sheet.state.noDeliveries)).not.toBeInTheDocument();
    expect(sheet.state.noDeliveriesMultiUnload).not.toMatch(/más adelante/i);

    await user.click(screen.getByRole("button", { name: sheet.action.add }));

    await waitFor(() => {
      expect(
        screen.getAllByText(sheet.validation.deliveryAssignmentRequired)
          .length,
      ).toBeGreaterThanOrEqual(1);
    });
    expect(onSubmit).not.toHaveBeenCalled();
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
    const multiUnloadStops: CargoSheetDeliveryStop[] = [
      deliveryStops[0]!,
      {
        index: 2,
        address: "Cliente 2",
        city: "Guadalupe",
        locationName: "Descarga 2",
      },
    ];

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={multiUnloadStops}
        initialValues={{
          ...validCargo,
          movements: [
            { stopIndex: 0, movementType: "pickup" },
            { stopIndex: 1, movementType: "delivery", weight: 500, units: 5 },
          ],
        }}
        editingIndex={null}
        allowAddDelivery
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

  it("keeps Unidad · Cantidad · Peso in one row and preserves long satUnitName on submit (C2)", async () => {
    const user = userEvent.setup();
    const longUnitName =
      "Botella, protegida o no, de vidrio, de cualquier capacidad, con tapa de rosca o tapón a presión";
    const cargoWithLongUnitName: TripCargoFormValues = {
      ...validCargo,
      satUnitCode: "XPB",
      satUnitName: longUnitName,
      // Sin qty en delivery: el test muta peso/uds de la carga; F7 bloquea exceso.
      movements: [
        { stopIndex: 0, movementType: "pickup" },
        { stopIndex: 1, movementType: "delivery" },
      ],
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

    expect(screen.getByTestId("unit-search")).toBeInTheDocument();
    expect(screen.queryByText(longUnitName)).not.toBeInTheDocument();
    expect(document.querySelector(".sm\\:max-w-xl")).toBeTruthy();

    const unitsInput = screen.getByRole("spinbutton", {
      name: (_content, element) => element.id === "cargo-units",
    });
    const weightInput = screen.getByRole("textbox", {
      name: (_content, element) => element.id === "cargo-weight-kg",
    });
    expect(unitsInput).toHaveClass("font-mono");
    expect(weightInput).toHaveClass("font-mono");
    expect(weightInput).toHaveValue("1,000.00");

    fireEvent.change(unitsInput, { target: { value: "12" } });
    expect(unitsInput).toHaveValue(12);

    await user.clear(weightInput);
    await user.type(weightInput, "250");
    await user.tab();
    expect(weightInput).toHaveValue("250.00");

    await user.click(screen.getByRole("button", { name: sheet.action.add }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const submitted = onSubmit.mock.calls[0][0] as TripCargoFormValues;
    expect(submitted.satUnitCode).toBe("XPB");
    expect(submitted.satUnitName).toBe(longUnitName);
    expect(submitted.units).toBe(12);
    expect(submitted.weightInKg).toBe(250);
  });

  it("shows capacity hint without vehicle and keeps unit search in Cuánto (C4)", () => {
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

    expect(screen.getByTestId("unit-search")).toBeInTheDocument();
    expect(
      screen.getByText(sheet.hint.capacityNoVehicle),
    ).toBeInTheDocument();
  });

  it("does not say «sin unidad» when fleet unit is assigned without capacity (V5-P2-5)", () => {
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
        vehicleUnitNumber="U-002"
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(sheet.hint.capacityNoCapacityKnown),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(sheet.hint.capacityNoVehicle),
    ).not.toBeInTheDocument();
  });

  it("apaga y no guarda material peligroso cuando la marca es 0", async () => {
    const user = userEvent.setup();
    mockCatalogMark("omit");
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={{
          ...validCargo,
          hazardousMaterial: true,
          requiresHazmat: true,
          hazardousMaterialCode: "UN1263",
          packagingType: "4G",
          packagingDescription: "Cajas certificadas UN",
        }}
        editingIndex={0}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={onSubmit}
      />,
    );

    await ensureRequirementsOpen(user);
    expect(
      await screen.findByText(sheet.hint.materialPeligrosoOmit),
    ).toBeInTheDocument();
    const hazmat = screen.getByRole("checkbox", { name: sheet.label.isHazmat });
    expect(hazmat).toBeDisabled();
    expect(hazmat).not.toBeChecked();
    expect(screen.queryByText(sheet.hint.hazmatRequired)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: sheet.action.save }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const submitted = onSubmit.mock.calls[0][0] as TripCargoFormValues;
    expect(submitted.hazardousMaterial).toBe(false);
    expect(submitted.requiresHazmat).toBe(false);
    expect(submitted.hazardousMaterialCode).toBeUndefined();
    expect(submitted.packagingType).toBeUndefined();
    expect(submitted.packagingDescription).toBeUndefined();
  });

  it("anuncia No con marca 0,1 apagada y exige clave y embalaje al encenderla", async () => {
    const user = userEvent.setup();
    mockCatalogMark("declare_optional");
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={0}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={onSubmit}
      />,
    );

    await ensureRequirementsOpen(user);
    expect(
      await screen.findByText(sheet.hint.materialPeligrosoOptionalOff),
    ).toBeInTheDocument();
    const hazmat = screen.getByRole("checkbox", { name: sheet.label.isHazmat });
    expect(hazmat).toBeEnabled();
    expect(hazmat).not.toBeChecked();
    expect(screen.queryByText(sheet.hint.hazmatRequired)).not.toBeInTheDocument();

    await user.click(hazmat);

    expect(
      await screen.findByText(sheet.hint.materialPeligrosoOptionalOn),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: sheet.action.save }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Selecciona la clave de material peligroso").length,
      ).toBeGreaterThanOrEqual(1);
    });
    expect(
      screen.getAllByText("Selecciona el tipo de embalaje").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("Captura la descripción del embalaje").length,
    ).toBeGreaterThanOrEqual(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("deja encendida y deshabilitada la marca 1 y bloquea el guardado sin clave", async () => {
    const user = userEvent.setup();
    mockCatalogMark("declare_required_si");
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

    await ensureRequirementsOpen(user);
    expect(await screen.findByText(sheet.hint.hazmatRequired)).toBeInTheDocument();
    const hazmat = screen.getByRole("checkbox", { name: sheet.label.isHazmat });
    expect(hazmat).toBeChecked();
    expect(hazmat).toBeDisabled();

    await user.click(screen.getByRole("button", { name: sheet.action.add }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Selecciona la clave de material peligroso").length,
      ).toBeGreaterThanOrEqual(1);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("avisa sin marca y deja guardar sin forzar el interruptor", async () => {
    const user = userEvent.setup();
    mockCatalogMark("unknown");
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={{
          ...validCargo,
          hazardousMaterial: true,
          hazardousMaterialCode: "UN1263",
          packagingType: "4G",
          packagingDescription: "Cajas certificadas UN",
        }}
        editingIndex={0}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={onSubmit}
      />,
    );

    await ensureRequirementsOpen(user);
    expect(
      await screen.findByText(sheet.hint.materialPeligrosoUnknown),
    ).toBeInTheDocument();
    const hazmat = screen.getByRole("checkbox", { name: sheet.label.isHazmat });
    expect(hazmat).toBeEnabled();
    expect(hazmat).toBeChecked();

    await user.click(screen.getByRole("button", { name: sheet.action.save }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const submitted = onSubmit.mock.calls[0][0] as TripCargoFormValues;
    expect(submitted.hazardousMaterial).toBe(true);
    expect(submitted.requiresHazmat).toBe(false);
    expect(submitted.hazardousMaterialCode).toBe("UN1263");
  });

  it("clasifica la clave elegida en el alta: 0,1 no se trata como marca 1", async () => {
    const user = userEvent.setup();
    mockCatalogMark("declare_optional");

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={{
          ...validCargo,
          satProductCode: "",
          hazardousMaterial: true,
          requiresHazmat: true,
        }}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={vi.fn()}
      />,
    );

    await ensureRequirementsOpen(user);
    await user.click(
      screen.getByRole("button", { name: "Elegir clave de prueba" }),
    );

    expect(
      await screen.findByText(sheet.hint.materialPeligrosoOptionalOff),
    ).toBeInTheDocument();
    const hazmat = screen.getByRole("checkbox", { name: sheet.label.isHazmat });
    expect(hazmat).toBeEnabled();
    expect(hazmat).not.toBeChecked();
    expect(screen.queryByText(sheet.hint.hazmatRequired)).not.toBeInTheDocument();
  });

  it("F7: soft-warns under-allocated deliveries but still allows Guardar", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    // C7: medidor + alert under solo con ≥2 descargas (1 unload = fila muted).
    const multiUnloadStops: CargoSheetDeliveryStop[] = [
      deliveryStops[0]!,
      {
        index: 2,
        address: "Cliente 2",
        city: "Guadalupe",
        locationName: "Descarga 2",
      },
    ];

    render(
      <CargoMovementSheet
        open
        onOpenChange={onOpenChange}
        pickupStop={pickupStop}
        availableDeliveryStops={multiUnloadStops}
        initialValues={validCargo}
        editingIndex={0}
        allowAddDelivery
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByText(sheet.alert.underAllocatedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(sheet.alert.underAllocatedBody("500 kg / 5 uds")),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: sheet.action.save }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("D-F7-8: 1 delivery with empty qty inherits on submit — no under banner", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={{
          ...validCargo,
          movements: [
            { stopIndex: 0, movementType: "pickup" },
            { stopIndex: 1, movementType: "delivery" },
          ],
        }}
        editingIndex={0}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.queryByText(sheet.alert.underAllocatedTitle),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: sheet.action.save }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    const submitted = onSubmit.mock.calls[0]?.[0] as TripCargoFormValues;
    expect(submitted.movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          movementType: "delivery",
          stopIndex: 1,
          weight: 1000,
          units: 10,
        }),
      ]),
    );
  });

  it("D-F7-8: ≥2 deliveries with empty qty keep soft under (no inherit)", () => {
    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={[
          ...deliveryStops,
          {
            index: 2,
            address: "Cliente 2",
            city: "Santa Catarina",
            locationName: "Descarga 2",
          },
        ]}
        initialValues={{
          ...validCargo,
          movements: [
            { stopIndex: 0, movementType: "pickup" },
            { stopIndex: 1, movementType: "delivery" },
            { stopIndex: 2, movementType: "delivery" },
          ],
        }}
        editingIndex={0}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(sheet.alert.underAllocatedTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(sheet.alert.underAllocatedBody("1,000 kg / 10 uds")),
    ).toBeInTheDocument();
  });

  it("F7: blocks Guardar when deliveries exceed cargo totals", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const multiUnloadStops: CargoSheetDeliveryStop[] = [
      deliveryStops[0]!,
      {
        index: 2,
        address: "Cliente 2",
        city: "Guadalupe",
        locationName: "Descarga 2",
      },
    ];

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={multiUnloadStops}
        initialValues={{
          ...validCargo,
          movements: [
            { stopIndex: 0, movementType: "pickup" },
            {
              stopIndex: 1,
              movementType: "delivery",
              weight: 1500,
              units: 5,
            },
          ],
        }}
        editingIndex={0}
        allowAddDelivery
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={onSubmit}
      />,
    );

    expect(
      screen.getByText(sheet.alert.overAllocatedTitle),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: sheet.action.save }));

    await waitFor(() => {
      expect(
        screen.getByText(
          sheet.validation.deliveryWeightExceeded(1500, 1000),
        ),
      ).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("contains long delivery stop labels without forcing sheet overflow (ellipsis + title)", () => {
    const longLocation =
      "Movimientos Industriales de la Construcción S.A. de C.V. (Movimientos Industriales)";
    const longStop: CargoSheetDeliveryStop = {
      index: 5,
      address: "Calle Industrial 1200 Oriente",
      city: "Monterrey",
      locationName: longLocation,
      clientName: "Movimientos Industriales",
    };
    const otherStop: CargoSheetDeliveryStop = {
      index: 2,
      address: "Otro",
      city: "Apodaca",
      locationName: "Descarga 2",
    };
    const longLabel = sheet.format.deliveryStopOption(
      longStop.index,
      longStop.locationName || "",
      longStop.address,
      longStop.city,
    );

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={[otherStop, longStop]}
        initialValues={{
          ...validCargo,
          movements: [
            { stopIndex: 0, movementType: "pickup" },
            {
              stopIndex: 5,
              movementType: "delivery",
              weight: 500,
              units: 5,
            },
          ],
        }}
        editingIndex={0}
        allowAddDelivery
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("combobox", {
      name: sheet.label.deliveryStop,
    });
    expect(trigger).toHaveAttribute("title", longLabel);
    expect(trigger.className).toMatch(/min-w-0/);
  });

  it("truncates read-only delivery stop labels with full title", () => {
    const longLocation =
      "Centro de Distribución Logística Internacional del Norte S.A. de C.V.";
    const longStop: CargoSheetDeliveryStop = {
      index: 2,
      address: "Av. Larga 999",
      city: "Saltillo",
      locationName: longLocation,
    };
    const longLabel = sheet.format.deliveryStopOption(
      longStop.index,
      longStop.locationName || "",
      longStop.address,
      longStop.city,
    );

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={[longStop]}
        initialValues={{
          ...validCargo,
          movements: [
            { stopIndex: 0, movementType: "pickup" },
            {
              stopIndex: 2,
              movementType: "delivery",
              weight: 100,
              units: 1,
            },
          ],
        }}
        editingIndex={0}
        deliveriesReadOnly
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={vi.fn()}
      />,
    );

    const labelEl = screen.getByText(longLabel);
    expect(labelEl.className).toMatch(/truncate/);
    expect(labelEl).toHaveAttribute("title", longLabel);
  });

  it("C6: missing pickup opens Dónde va first with amber badge assign-on-save (D-PRD-2)", () => {
    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={{
          ...validCargo,
          movements: [],
        }}
        editingIndex={0}
        missingPickupMovement
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(sheet.sectionSummary.whereMissingPickup),
    ).toBeInTheDocument();
    expect(screen.getByText(sheet.badge.assignOnSave)).toBeInTheDocument();
    expect(screen.getByText(sheet.section.where)).toBeInTheDocument();
    // D-PRD-2: Dónde va aparece antes que Qué se transporta en el DOM.
    const whereEl = screen.getByText(sheet.section.where);
    const productEl = screen.getByText(sheet.section.product);
    expect(
      whereEl.compareDocumentPosition(productEl) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("C9: invalid submit opens product section and shows summary above footer", async () => {
    const user = userEvent.setup();
    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={pickupStop}
        availableDeliveryStops={deliveryStops}
        initialValues={{
          ...validCargo,
          satProductCode: "",
          description: "",
          movements: [{ stopIndex: 0, movementType: "pickup" }],
        }}
        editingIndex={null}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={0}
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: sheet.action.add }));

    await waitFor(() => {
      expect(
        screen.getByText(sheet.validation.missingRequiredTitle),
      ).toBeInTheDocument();
    });
    // Summary queda en el cuerpo, antes del pie (Cancelar).
    const summary = screen.getByText(sheet.validation.missingRequiredTitle);
    const cancel = screen.getByRole("button", { name: sheet.action.cancel });
    expect(
      summary.compareDocumentPosition(cancel) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows pickup chooser inside Dónde va when multiple pickups (C6)", () => {
    const longPickup: CargoSheetPickupStop = {
      index: 0,
      address: "Planta Norte",
      city: "Monterrey",
      locationName:
        "Coca Cola: Ciel Norte — Centro Embotellador Metropolitano de Bebidas S.A. de C.V.",
      clientName: "Coca-Cola FEMSA",
    };
    const otherPickup: CargoSheetPickupStop = {
      index: 3,
      address: "Planta Sur",
      city: "Apodaca",
      locationName: "Bodega Sur",
    };

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={longPickup}
        availablePickupStops={[longPickup, otherPickup]}
        onPickupStopChange={vi.fn()}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={0}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(sheet.section.where)).toBeInTheDocument();
    const trigger = screen.getByRole("combobox", {
      name: sheet.label.pickupStop,
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("id", "cargo-pickup-stop");
  });

  it("shows C3 header edit summary and stop summary row (no dense pickup box)", () => {
    const longPickup: CargoSheetPickupStop = {
      index: 0,
      address: "Calle Muy Larga 1000",
      city: "Monterrey",
      locationName:
        "Almacén Central de Materias Primas Industriales del Noreste",
      clientName: "Cliente con razón social extremadamente larga S.A. de C.V.",
    };

    render(
      <CargoMovementSheet
        open
        onOpenChange={vi.fn()}
        pickupStop={longPickup}
        availableDeliveryStops={deliveryStops}
        initialValues={validCargo}
        editingIndex={0}
        vehicleCapacityKg={null}
        baselineWeightKg={0}
        stopCargoCount={1}
        vehicleUnitNumber={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(sheet.title.edit)).toBeInTheDocument();
    expect(
      screen.getByText(sheet.phaseRule.draftOrScheduled.edit),
    ).toBeInTheDocument();
    expect(
      screen.getByText(sheet.context.registeredHere(1), { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText(sheet.context.unitUnassigned)).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: sheet.label.pickupStop }),
    ).not.toBeInTheDocument();
  });

  it("aplica la marca del GET aunque StrictMode cancele la primera hidratación", async () => {
    const user = userEvent.setup();
    pickedProduct = {
      code: "50202200",
      name: "Bebidas alcohólicas",
      metadata: null,
    };
    vi.mocked(fetchRegulatoryFlagsForSatProductCp).mockImplementation(
      async (code) => {
        const body = {
          data: {
            code,
            name: "Bebidas alcohólicas",
            metadata: { material_peligroso: "0,1" },
          },
        };
        const meta = body.data.metadata;
        return {
          ...extractCargoRegulatoryFlags(meta),
          materialPeligrosoRequirement:
            classifyMaterialPeligrosoCatalogRequirement(meta),
        };
      },
    );

    render(
      <StrictMode>
        <CargoMovementSheet
          open
          onOpenChange={vi.fn()}
          pickupStop={pickupStop}
          availableDeliveryStops={deliveryStops}
          initialValues={{
            ...validCargo,
            satProductCode: "",
            description: "",
          }}
          editingIndex={null}
          vehicleCapacityKg={null}
          baselineWeightKg={0}
          stopCargoCount={0}
          onSubmit={vi.fn()}
        />
      </StrictMode>,
    );

    await ensureRequirementsOpen(user);
    await user.click(
      screen.getByRole("button", { name: "Elegir clave de prueba" }),
    );

    expect(
      await screen.findByText(sheet.hint.materialPeligrosoOptionalOff),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(sheet.hint.materialPeligrosoUnknown),
    ).not.toBeInTheDocument();
    const hazmat = screen.getByRole("checkbox", { name: sheet.label.isHazmat });
    expect(hazmat).toBeEnabled();
    expect(hazmat).not.toBeChecked();
    expect(fetchRegulatoryFlagsForSatProductCp).toHaveBeenCalledWith("50202200");
  });
});
