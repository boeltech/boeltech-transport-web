import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehicleForm } from "./VehicleForm";
import { VEHICLE_EDIT_SECTION_IDS } from "./vehicleEditSections";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { Vehicle } from "../../domain";

/**
 * Aviso soft tipo ↔ ConfigVehicular en el formulario (PRD D2/D3, CA1–CA3):
 * hint ámbar bajo el select, sufijo en Revisión, y nada de esto cuenta como
 * error de RHF (no FieldInlineError, no riel, no bloqueo de Siguiente).
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
  // Select de catálogo simplificado: un <select> nativo que propaga el código.
  ConfigAutotransporteSelect: ({
    triggerId,
    value,
    onValueChange,
  }: {
    triggerId?: string;
    value: string;
    onValueChange: (v: string) => void;
  }) => (
    <select
      id={triggerId}
      aria-label="config-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">—</option>
      <option value="C3">C3</option>
      <option value="T3S2">T3S2</option>
    </select>
  ),
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
    type: "torton",
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
      insuranceExpiry: "2099-12-31",
      sctPermitNumber: "SCT-1",
      sctPermitExpiry: "2099-12-31",
    },
    status: "available",
    isActive: true,
    deactivatedAt: null,
    deactivatedBy: null,
    deactivationReasonCode: null,
    deactivationNote: null,
    cartaPorte: {
      satTipoPermisoCode: "TPAF01",
      satConfigAutotransporteCode: "T3S2",
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

function renderForm(
  props: Partial<ComponentProps<typeof VehicleForm>>,
  initialEntry = "/vehicles/v-edit/edit",
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <VehicleForm onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const fc = vehiclesCopy.form;
const hint = fc.hint.typeConfigCoherence;

async function selectConfig(code: string) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText("config-select"), {
      target: { value: code },
    });
  });
}

describe("VehicleForm — aviso soft tipo ↔ ConfigVehicular (D2/D3)", () => {
  it("CA1: cruce en alta (paso Carta Porte) → hint ámbar; config coherente lo quita", async () => {
    // El wizard arranca con tipo Tractocamión (Radix Select no se opera en
    // jsdom); el cruce espejo de CA1 es truck + C3 → hint, T3S2 → desaparece.
    renderForm({ wizardMode: true, wizardStepIndex: 2 });

    await selectConfig("T3S2");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();

    await selectConfig("C3");
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(hint.lead);
    expect(note).toHaveTextContent("Tractocamión");
    expect(note).toHaveTextContent("C3");
    expect(note).toHaveTextContent(hint.tail);
    expect(note.className).toContain("text-warning");

    // No es un error de campo: sin aria-invalid ni FieldInlineError.
    expect(screen.getByLabelText("config-select")).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      document.getElementById("satConfigAutotransporteCode-error"),
    ).toBeNull();

    await selectConfig("T3S2");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("CA3: edición tortón + T3S2 → hint visible y el riel no cuenta error en Carta Porte", () => {
    renderForm({ vehicle: buildVehicle() });

    const note = screen.getByRole("note");
    expect(note).toHaveTextContent("Tortón");
    expect(note).toHaveTextContent("T3S2");
    expect(note).toHaveTextContent(
      vehiclesCopy.typeConfigCoherence.expectedByType.torton,
    );

    // El riel de secciones no marca errores (el aviso no toca RHF).
    const rail = screen.getByRole("navigation", {
      name: fc.edit.sidebar.title,
    });
    expect(within(rail).queryByLabelText(/errores/)).not.toBeInTheDocument();
  });

  it("CA6: edición pickup + C2 → sin hint", () => {
    renderForm({
      vehicle: buildVehicle({
        type: "pickup",
        cartaPorte: {
          satTipoPermisoCode: "TPAF01",
          satConfigAutotransporteCode: "C2",
          pesoBrutoVehicular: 3,
          insuranceCompany: "AXA",
          aseguraMedioAmbiente: null,
          polizaMedioAmbiente: null,
          aseguraCarga: null,
          polizaCarga: null,
        } as Vehicle["cartaPorte"],
      }),
    });

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("CA2: la revisión del wizard muestra el sufijo «No coincide con el tipo …»", async () => {
    renderForm({ wizardMode: true, wizardStepIndex: 3 });

    expect(
      screen.queryByText(fc.hint.reviewTypeMismatch("Tractocamión")),
    ).not.toBeInTheDocument();

    // Todos los paneles están montados (hidden): el select de config existe.
    await selectConfig("C3");

    expect(
      screen.getByText(fc.hint.reviewTypeMismatch("Tractocamión")),
    ).toBeInTheDocument();
  });

  it("D4: `#vehicle-edit-carta-porte` en la URL de edición desplaza a la sección Carta Porte", () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      renderForm(
        { vehicle: buildVehicle() },
        `/vehicles/v-edit/edit#${VEHICLE_EDIT_SECTION_IDS.cartaPorte}`,
      );
      expect(scrollIntoView).toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});
