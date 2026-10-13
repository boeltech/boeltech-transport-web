import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehicleActions } from "./VehicleActions";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { VehicleListItem } from "../../domain";

type Callbacks = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

const { mockUpdateMutate, mockHasPermission, callbacks } = vi.hoisted(() => ({
  mockUpdateMutate: vi.fn(),
  mockHasPermission: vi.fn(),
  callbacks: { update: {} as Callbacks },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("../../application", () => ({
  useUpdateVehicle: (cb: Callbacks) => {
    callbacks.update = cb;
    return { mutate: mockUpdateMutate, isPending: false };
  },
  useDeleteVehicle: () => ({ mutate: vi.fn(), isPending: false }),
  useRestoreVehicle: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function buildVehicle(
  overrides: Partial<VehicleListItem> = {},
): VehicleListItem {
  return {
    id: "v-1",
    unitNumber: "U-01",
    licensePlate: "ABC1234",
    brand: "Kenworth",
    model: "T680",
    year: 2024,
    type: "truck",
    color: null,
    status: "available",
    currentMileage: 1000,
    isActive: true,
    insurancePolicy: null,
    insuranceExpiry: null,
    sctPermitNumber: null,
    sctPermitExpiry: null,
    satTipoPermisoCode: null,
    satConfigAutotransporteCode: null,
    pesoBrutoVehicular: null,
    insuranceCompany: null,
    remolques: [],
    branchId: null,
    branchName: null,
    branchCode: null,
    ...overrides,
  };
}

function renderActions(vehicle: VehicleListItem = buildVehicle()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VehicleActions vehicle={vehicle} variant="buttons" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const statusCopy = vehiclesCopy.detail.statusChange;

describe("VehicleActions status change (D2/D9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callbacks.update = {};
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "vehicles" && (action === "update" || action === "delete"),
    );
  });

  it("abre el dialog sin campo de motivo y confirma solo status", async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole("button", { name: /cambiar estado/i }));
    await user.click(
      screen.getByRole("menuitem", { name: /mantenimiento/i }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(statusCopy.title);
    expect(
      screen.queryByLabelText(/motivo/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/motivo del cambio/i),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: statusCopy.confirm }),
    );

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: "v-1",
      data: { status: "in_maintenance" },
    });
  });

  it("muestra Alert inline en el dialog cuando falla el cambio de estado", async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole("button", { name: /cambiar estado/i }));
    await user.click(
      screen.getByRole("menuitem", { name: /mantenimiento/i }),
    );
    await user.click(
      screen.getByRole("button", { name: statusCopy.confirm }),
    );

    callbacks.update.onError?.(new Error("Unidad en viaje activo"));

    expect(await screen.findByText(statusCopy.errorTitle)).toBeInTheDocument();
    expect(screen.getByText("Unidad en viaje activo")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dropdown de listado no ofrece cambio de estado aunque haya update", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <MemoryRouter>
          <VehicleActions
            vehicle={buildVehicle()}
            variant="dropdown"
            onView={vi.fn()}
            onEdit={vi.fn()}
            onDeactivate={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: /abrir menú de acciones/i }),
    );

    expect(
      screen.getByRole("menuitem", { name: /ver detalles/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /^editar$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /mantenimiento/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /fuera de servicio/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /marcar disponible/i }),
    ).not.toBeInTheDocument();
  });
});
