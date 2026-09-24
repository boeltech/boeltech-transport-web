import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehicleActions } from "./VehicleActions";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { VehicleListItem } from "../../domain";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("../../application", () => ({
  useUpdateVehicle: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteVehicle: () => ({ mutate: vi.fn(), isPending: false }),
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

function renderActions(vehicle: VehicleListItem) {
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

describe("VehicleActions billing policy (F1)", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "vehicles" && (action === "update" || action === "delete"),
    );
  });

  it("eliminar tracto cobrable muestra la frase de baja sin link (gerente)", async () => {
    const user = userEvent.setup();
    renderActions(buildVehicle());

    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(
      screen.getByText(vehiclesCopy.billingPolicy.remove, { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Ver suscripción" }),
    ).not.toBeInTheDocument();
  });

  it("eliminar pickup no muestra la frase de crédito", async () => {
    const user = userEvent.setup();
    renderActions(buildVehicle({ type: "pickup" }));

    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(
      screen.queryByText(vehiclesCopy.billingPolicy.remove, { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("fuera de servicio de un tracto cobrable muestra la frase de baja", async () => {
    const user = userEvent.setup();
    renderActions(buildVehicle());

    await user.click(screen.getByRole("button", { name: /cambiar estado/i }));
    await user.click(
      screen.getByRole("menuitem", { name: /fuera de servicio/i }),
    );

    expect(
      screen.getByText(vehiclesCopy.billingPolicy.remove, { exact: false }),
    ).toBeInTheDocument();
  });

  it("mantenimiento no muestra la frase de cobro", async () => {
    const user = userEvent.setup();
    renderActions(buildVehicle());

    await user.click(screen.getByRole("button", { name: /cambiar estado/i }));
    await user.click(
      screen.getByRole("menuitem", { name: /mantenimiento/i }),
    );

    expect(screen.getByText(/pasará de/i)).toBeInTheDocument();
    expect(
      screen.queryByText(vehiclesCopy.billingPolicy.remove, { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("admin con billing.read ve el link en eliminar", async () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        (module === "vehicles" &&
          (action === "update" || action === "delete")) ||
        (module === "billing" && action === "read"),
    );
    const user = userEvent.setup();
    renderActions(buildVehicle());

    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(
      screen.getByRole("link", { name: "Ver suscripción" }),
    ).toHaveAttribute("href", "/settings/subscription");
  });
});
