import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehicleForm } from "./VehicleForm";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import { createVehicleSchema } from "../validation";
import type { Vehicle } from "../../domain";

/**
 * Alta progresiva (PRD D3/D4): las vigencias siguen siendo opcionales, pero el
 * formulario avisa que sin ellas la unidad no se asigna, y la revisión del
 * wizard señala el folio capturado sin fecha.
 */

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: () => false }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [] } }),
}));

vi.mock("@features/catalogs", () => ({
  CatalogTypeCode: {
    SAT_TIPO_PERMISO: "sat_tipo_permiso",
    SAT_CONFIG_AUTOTRANSPORTE: "sat_config_autotransporte",
  },
  TipoPermisoSelect: () => <div />,
  ConfigAutotransporteSelect: () => <div />,
  useCatalogOptions: () => ({ data: [], isLoading: false }),
}));

function buildVehicle(): Vehicle {
  return {
    id: "v-edit",
    tenantId: "t-1",
    unitNumber: "U-10",
    licensePlate: "ABC1234",
    vin: "1XKAD49X0EJ123456",
    brand: "Kenworth",
    model: "T680",
    year: 2022,
    type: "truck",
    color: null,
    capacities: {
      loadCapacity: null,
      volumeCapacity: null,
      fuelTankCapacity: null,
      expectedFuelEfficiency: null,
    },
    currentMileage: 1000,
    documentation: {
      insurancePolicy: "POL-1",
      insuranceExpiry: null,
      sctPermitNumber: "SCT-1",
      sctPermitExpiry: null,
    },
    status: "available",
    isActive: true,
    deactivatedAt: null,
    deactivatedBy: null,
    deactivationReasonCode: null,
    deactivationNote: null,
    cartaPorte: {
      satTipoPermisoCode: "TPAF01",
      satConfigAutotransporteCode: "C2",
      pesoBrutoVehicular: 20,
      insuranceCompany: "AXA",
      aseguraMedioAmbiente: null,
      polizaMedioAmbiente: null,
      aseguraCarga: null,
      polizaCarga: null,
    } as Vehicle["cartaPorte"],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: null,
    updatedBy: null,
    createdByName: null,
    updatedByName: null,
    branchId: null,
    branchName: null,
    branchCode: null,
  } as Vehicle;
}

function renderForm(props: Partial<ComponentProps<typeof VehicleForm>>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VehicleForm onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fc = vehiclesCopy.form;

describe("VehicleForm — alta progresiva de vigencias (D3/D4)", () => {
  it("CA6: edición muestra el hint bajo ambos vencimientos y el campo sigue opcional", () => {
    renderForm({ vehicle: buildVehicle() });

    const hints = screen.getAllByText(fc.hint.expiryRequiredToAssign);
    expect(hints).toHaveLength(2);

    // Los DateField siguen montados y sin asterisco de obligatorio en su etiqueta.
    expect(document.getElementById("insuranceExpiry")).toBeTruthy();
    expect(document.getElementById("sctPermitExpiry")).toBeTruthy();
    for (const labelText of [fc.label.insuranceExpiry, fc.label.sctPermitExpiry]) {
      const label = screen.getByText(labelText).closest("label");
      expect(label).toBeTruthy();
      expect(label?.textContent).not.toContain("*");
    }
  });

  it("CA6: la alerta Carta Porte de edición aclara que la vigencia hace falta para asignar", () => {
    renderForm({ vehicle: buildVehicle() });

    expect(screen.getByText(fc.alert.cartaPorteEdit)).toBeInTheDocument();
    expect(fc.alert.cartaPorteEdit).toMatch(/asignarla a viajes/);
    expect(fc.alert.cartaPorteEdit).not.toMatch(/unidad operable/);
  });

  it("CA6: el schema acepta vencimientos vacíos (se puede guardar sin fecha)", () => {
    const result = createVehicleSchema.safeParse({
      unitNumber: "U-10",
      licensePlate: "ABC1234",
      vin: "",
      brand: "Kenworth",
      model: "T680",
      year: 2022,
      type: "truck",
      color: "",
      currentMileage: 0,
      insuranceCompany: "AXA",
      insurancePolicy: "POL-1",
      insuranceExpiry: "",
      satTipoPermisoCode: "TPAF01",
      sctPermitNumber: "SCT-1",
      sctPermitExpiry: "",
      satConfigAutotransporteCode: "C2",
      pesoBrutoVehicular: 20,
      aseguraMedioAmbiente: "",
      polizaMedioAmbiente: "",
    });

    expect(
      result.success ||
        !result.error.issues.some(
          (i) =>
            i.path.includes("insuranceExpiry") ||
            i.path.includes("sctPermitExpiry"),
        ),
    ).toBe(true);
  });

  it("D4: la revisión del wizard señala «Sin fecha de vencimiento» junto al folio", async () => {
    renderForm({ wizardMode: true, wizardStepIndex: 3 });

    // Sin folio ni fecha → solo «Sin registrar».
    expect(
      screen.queryByText(fc.hint.reviewNoExpiry),
    ).not.toBeInTheDocument();

    // `mode: "onChange"` dispara validación async del resolver: esperar dentro de act.
    await act(async () => {
      fireEvent.change(document.getElementById("insurancePolicy")!, {
        target: { value: "POL-77" },
      });
      fireEvent.change(document.getElementById("sctPermitNumber")!, {
        target: { value: "SCT-77" },
      });
    });

    expect(screen.getAllByText(fc.hint.reviewNoExpiry)).toHaveLength(2);
    expect(screen.getByText(/POL-77/)).toBeInTheDocument();
    expect(screen.getByText(/SCT-77/)).toBeInTheDocument();
  });
});
