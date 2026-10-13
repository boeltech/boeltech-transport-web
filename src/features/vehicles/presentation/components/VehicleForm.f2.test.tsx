import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehicleForm } from "./VehicleForm";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import { VEHICLE_EDIT_SECTION_IDS } from "./vehicleEditSections";
import type { Vehicle } from "../../domain";

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

function buildVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
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
    deactivatedByName: null,
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
    ...overrides,
  } as Vehicle;
}

function renderEditForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <VehicleForm
          vehicle={buildVehicle()}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fc = vehiclesCopy.form;

describe("VehicleForm edit F2 (D5/D6/D7)", () => {
  it("monta rail con las 5 secciones D7 y pie sticky", () => {
    const { container } = renderEditForm();

    expect(
      screen.getByRole("navigation", { name: fc.edit.sidebar.title }),
    ).toBeInTheDocument();

    for (const label of [
      fc.section.identification.nav,
      fc.section.characteristics.nav,
      fc.section.capacities.nav,
      fc.section.documentation.nav,
      fc.section.cartaPorte.nav,
    ]) {
      expect(
        screen.getByRole("button", { name: new RegExp(label, "i") }),
      ).toBeInTheDocument();
    }

    expect(
      document.getElementById(VEHICLE_EDIT_SECTION_IDS.identification),
    ).toBeTruthy();
    expect(
      document.getElementById(VEHICLE_EDIT_SECTION_IDS.capacities),
    ).toBeTruthy();
    expect(
      document.getElementById(VEHICLE_EDIT_SECTION_IDS.cartaPorte),
    ).toBeTruthy();

    expect(container.querySelector(".sticky.bottom-0")).toBeTruthy();
    expect(screen.getByRole("button", { name: fc.action.save })).toBeDisabled();
  });

  it("clic en rail hace scroll a la seccion", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    renderEditForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(fc.section.cartaPorte.nav, "i"),
      }),
    );

    expect(scrollIntoView).toHaveBeenCalled();
  });
});
