import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isBillableMotrizType } from "@features/vehicles/domain";
import { VehicleForm } from "./VehicleForm";
import { VehicleGridSelect } from "./VehicleFormFields";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import { VEHICLE_TYPE_LABELS, VehicleType, type VehicleTypeValue } from "../../domain";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [] } }),
}));

vi.mock("@features/catalogs", () => ({
  TipoPermisoSelect: () => <div />,
  ConfigAutotransporteSelect: () => <div />,
}));

function renderForm(wizardStepIndex = 0) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VehicleForm
          onSubmit={vi.fn()}
          wizardMode
          wizardStepIndex={wizardStepIndex}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VehicleForm billing policy (F1)", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(false);
  });

  it("tipo tracto (default) muestra el hint de cobro", () => {
    renderForm(0);
    expect(
      screen.getAllByText(vehiclesCopy.billingPolicy.create).length,
    ).toBeGreaterThan(0);
  });

  it("tipo pickup oculta el hint de cobro", () => {
    function PickupHintHarness() {
      const form = useForm<{ type: VehicleTypeValue }>({
        defaultValues: { type: VehicleType.PICKUP },
      });
      const type = form.watch("type");
      return (
        <VehicleGridSelect
          control={form.control}
          name="type"
          label="Tipo de vehículo"
          hint={
            isBillableMotrizType(type)
              ? vehiclesCopy.billingPolicy.create
              : undefined
          }
          options={(Object.values(VehicleType) as VehicleTypeValue[]).map(
            (value) => ({
              value,
              label: VEHICLE_TYPE_LABELS[value],
            }),
          )}
        />
      );
    }

    render(<PickupHintHarness />);
    expect(screen.getByText("Camioneta")).toBeInTheDocument();
    expect(
      screen.queryByText(vehiclesCopy.billingPolicy.create),
    ).not.toBeInTheDocument();
  });

  it("revisión de tracto muestra Alert info y no bloquea el alta", () => {
    renderForm(3);
    const alerts = screen.getAllByRole("alert");
    expect(
      alerts.some((el) =>
        el.textContent?.includes(vehiclesCopy.billingPolicy.create),
      ),
    ).toBe(true);
    expect(
      screen.queryByRole("link", { name: "Ver suscripción" }),
    ).not.toBeInTheDocument();
  });

  it("revisión con billing.read muestra el link a suscripción", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "billing" && action === "read",
    );
    renderForm(3);
    expect(
      screen.getByRole("link", { name: "Ver suscripción" }),
    ).toHaveAttribute("href", "/settings/subscription");
  });
});
