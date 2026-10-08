import type { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { VehicleDeactivateDialog } from "./VehicleDeactivateDialog";
import { VehicleRestoreDialog } from "./VehicleRestoreDialog";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { VehicleLifecycleTarget } from "./vehicleLifecycleTarget";

type Callbacks = {
  onSuccess?: (value?: unknown) => void;
  onError?: (error: Error) => void;
};

const {
  mockDeleteMutate,
  mockRestoreMutate,
  mockToast,
  mockHasPermission,
  callbacks,
} = vi.hoisted(() => ({
  mockDeleteMutate: vi.fn(),
  mockRestoreMutate: vi.fn(),
  mockToast: vi.fn(),
  mockHasPermission: vi.fn(() => false),
  callbacks: { delete: {} as Callbacks, restore: {} as Callbacks },
}));

vi.mock("../../application", () => ({
  useDeleteVehicle: (cb: Callbacks) => {
    callbacks.delete = cb;
    return { mutate: mockDeleteMutate, isPending: false };
  },
  useRestoreVehicle: (cb: Callbacks) => {
    callbacks.restore = cb;
    return { mutate: mockRestoreMutate, isPending: false };
  },
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

const truck: VehicleLifecycleTarget = {
  id: "v-1",
  unitNumber: "T-12",
  type: "truck",
  status: "available",
  isActive: true,
};

const dCopy = vehiclesCopy.deactivate;
const rCopy = vehiclesCopy.restore;

function renderWithRouter(ui: ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/vehicles"]}>
      <Routes>
        <Route path="/vehicles" element={ui} />
        <Route path="/trips/:id" element={<p>Pantalla viaje</p>} />
        <Route path="/vehicles/:id" element={<p>Pantalla unidad</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

async function pickReason(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("combobox", { name: /motivo de la baja/i }));
  const listbox = await screen.findByRole("listbox");
  await user.click(within(listbox).getByRole("option", { name: label }));
}

describe("VehicleDeactivateDialog (D2/D3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callbacks.delete = {};
  });

  it("muestra el copy del PRD, la ayuda de Fuera de servicio y la nota de cobro", () => {
    renderWithRouter(
      <VehicleDeactivateDialog vehicle={truck} open onOpenChange={vi.fn()} />,
    );

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(dCopy.title("T-12"))).toBeInTheDocument();
    expect(dialog).toHaveTextContent(dCopy.description);
    expect(dialog).toHaveTextContent(dCopy.outOfServiceHint);
    expect(dialog).toHaveTextContent(vehiclesCopy.billingPolicy.remove);
    expect(dialog).not.toHaveTextContent(/elimin|permanente/i);
  });

  it("exige motivo antes de enviar", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <VehicleDeactivateDialog vehicle={truck} open onOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: dCopy.confirm }));

    expect(await screen.findAllByText(dCopy.reasonRequired)).not.toHaveLength(0);
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it("con motivo «Otro» exige nota", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <VehicleDeactivateDialog vehicle={truck} open onOpenChange={vi.fn()} />,
    );

    await pickReason(user, "Otro");
    await user.click(screen.getByRole("button", { name: dCopy.confirm }));

    expect(await screen.findAllByText(dCopy.noteRequired)).not.toHaveLength(0);
    expect(mockDeleteMutate).not.toHaveBeenCalled();

    await user.type(screen.getByRole("textbox", { name: /nota/i }), "  chatarra ");
    await user.click(screen.getByRole("button", { name: dCopy.confirm }));

    expect(mockDeleteMutate).toHaveBeenCalledWith({
      id: "v-1",
      payload: { reasonCode: "otro", reasonNote: "chatarra" },
    });
  });

  it("envía el motivo y, al terminar, avisa con toast y cierra", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onDeactivated = vi.fn();
    mockDeleteMutate.mockImplementation(() => callbacks.delete.onSuccess?.());
    renderWithRouter(
      <VehicleDeactivateDialog
        vehicle={truck}
        open
        onOpenChange={onOpenChange}
        onDeactivated={onDeactivated}
      />,
    );

    await pickReason(user, "Venta");
    await user.click(screen.getByRole("button", { name: dCopy.confirm }));

    expect(mockDeleteMutate).toHaveBeenCalledWith({
      id: "v-1",
      payload: { reasonCode: "venta" },
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Unidad T-12 dada de baja" }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDeactivated).toHaveBeenCalled();
  });

  it("409 de viajes activos: lista enlaces (máx. 5 + «y N más») dentro del diálogo", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const trips = Array.from({ length: 6 }, (_, i) => ({
      id: `trip-${i + 1}`,
      trip_code: `VJ-00${i + 1}`,
    }));
    mockDeleteMutate.mockImplementation(() =>
      callbacks.delete.onError?.(
        new ApiError("La unidad tiene viajes activos.", 409, "VEHICLE_ASSIGNED_TO_ACTIVE_TRIP", {
          active_trip_count: 8,
          active_trip_codes: trips.map((t) => t.trip_code),
          active_trips: trips,
        }),
      ),
    );
    renderWithRouter(
      <VehicleDeactivateDialog vehicle={truck} open onOpenChange={onOpenChange} />,
    );

    await pickReason(user, "Venta");
    await user.click(screen.getByRole("button", { name: dCopy.confirm }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(dCopy.activeTrips.title);
    const links = within(dialog).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "VJ-001",
      "VJ-002",
      "VJ-003",
      "VJ-004",
      "VJ-005",
    ]);
    expect(links[0]).toHaveAttribute("href", "/trips/trip-1");
    expect(dialog).toHaveTextContent("(y 3 más)");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("otro error se muestra como Alert dentro del diálogo", async () => {
    const user = userEvent.setup();
    mockDeleteMutate.mockImplementation(() =>
      callbacks.delete.onError?.(
        new ApiError("La unidad ya está dada de baja.", 409, "VEHICLE_ALREADY_INACTIVE"),
      ),
    );
    renderWithRouter(
      <VehicleDeactivateDialog vehicle={truck} open onOpenChange={vi.fn()} />,
    );

    await pickReason(user, "Robo");
    await user.click(screen.getByRole("button", { name: dCopy.confirm }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(dCopy.errorTitle);
    expect(dialog).toHaveTextContent("La unidad ya está dada de baja.");
  });
});

describe("VehicleRestoreDialog (D6)", () => {
  const inactiveTruck: VehicleLifecycleTarget = { ...truck, isActive: false };

  beforeEach(() => {
    vi.clearAllMocks();
    callbacks.restore = {};
  });

  it("muestra el copy de restaurar como Disponible y la nota de alta si es cobrable", () => {
    renderWithRouter(
      <VehicleRestoreDialog vehicle={inactiveTruck} open onOpenChange={vi.fn()} />,
    );

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent(rCopy.title("T-12"));
    expect(dialog).toHaveTextContent(
      "Volverá al padrón como Disponible y podrá asignarse a viajes.",
    );
    expect(dialog).toHaveTextContent(vehiclesCopy.billingPolicy.create);
  });

  it("éxito: toast y cierre", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockRestoreMutate.mockImplementation(() =>
      callbacks.restore.onSuccess?.({ vehicle: {}, warnings: [] }),
    );
    renderWithRouter(
      <VehicleRestoreDialog vehicle={inactiveTruck} open onOpenChange={onOpenChange} />,
    );

    await user.click(screen.getByRole("button", { name: rCopy.confirm }));

    expect(mockRestoreMutate).toHaveBeenCalledWith("v-1");
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Unidad T-12 restaurada", variant: "success" }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("warning VEHICLE_BRANCH_CLEARED: toast con el mensaje y la pista de Editar", async () => {
    const user = userEvent.setup();
    const message = "Se restauró sin sucursal porque Norte ya no está activa.";
    mockRestoreMutate.mockImplementation(() =>
      callbacks.restore.onSuccess?.({
        vehicle: {},
        warnings: [
          {
            code: "VEHICLE_BRANCH_CLEARED",
            reason: "inactive",
            message,
            previousBranchId: "b-1",
            previousBranchName: "Norte",
          },
        ],
      }),
    );
    renderWithRouter(
      <VehicleRestoreDialog vehicle={inactiveTruck} open onOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: rCopy.confirm }));

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "warning",
        description: `${message} ${rCopy.branchClearedHint}`,
      }),
    );
  });

  it("choque de número económico: Alert con «Ver unidad» y el diálogo sigue abierto", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockRestoreMutate.mockImplementation(() =>
      callbacks.restore.onError?.(
        new ApiError(
          "El número económico T-12 ya lo usa otra unidad activa.",
          400,
          "UNIT_NUMBER_EXISTS",
          { conflicting_vehicle_id: "v-9", unit_number: "T-12" },
        ),
      ),
    );
    renderWithRouter(
      <VehicleRestoreDialog vehicle={inactiveTruck} open onOpenChange={onOpenChange} />,
    );

    await user.click(screen.getByRole("button", { name: rCopy.confirm }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent(rCopy.conflictUnitNumber("T-12"));
    expect(dialog).toHaveTextContent(rCopy.conflictHint);
    expect(
      within(dialog).getByRole("link", { name: rCopy.conflictViewUnit }),
    ).toHaveAttribute("href", "/vehicles/v-9");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("choque de placa usa el copy de placa", async () => {
    const user = userEvent.setup();
    mockRestoreMutate.mockImplementation(() =>
      callbacks.restore.onError?.(
        new ApiError("La placa ABC-123 ya la usa otra unidad activa.", 400, "LICENSE_PLATE_EXISTS", {
          conflicting_vehicle_id: "v-9",
          license_plate: "ABC-123",
        }),
      ),
    );
    renderWithRouter(
      <VehicleRestoreDialog vehicle={inactiveTruck} open onOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: rCopy.confirm }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      rCopy.conflictLicensePlate("ABC-123"),
    );
  });

  it("422 de autotransporte: muestra el detalle de la API", async () => {
    const user = userEvent.setup();
    mockRestoreMutate.mockImplementation(() =>
      callbacks.restore.onError?.(
        new ApiError("Falta la configuración vehicular SAT.", 422, "VEHICLE_AUTOTRANSPORTE_INCOMPLETE"),
      ),
    );
    renderWithRouter(
      <VehicleRestoreDialog vehicle={inactiveTruck} open onOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: rCopy.confirm }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      rCopy.notOperable("Falta la configuración vehicular SAT"),
    );
  });
});
