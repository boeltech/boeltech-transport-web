import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { VehicleDetailPage } from "./VehicleDetailPage";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { Vehicle } from "../../domain";

/**
 * Aviso soft tipo ERP ↔ ConfigVehicular (PRD D4, CA3–CA6, CA8). No bloquea,
 * no cambia campos; solo avisa y, con `vehicles.update`, ofrece revisar en
 * la sección Carta Porte de la edición.
 */

const { mockUseVehicle, mockHasPermission } = vi.hoisted(() => ({
  mockUseVehicle: vi.fn(),
  mockHasPermission: vi.fn(() => true),
}));

vi.mock("../../application", () => ({
  useVehicle: (...args: unknown[]) => mockUseVehicle(...args),
  useUpdateVehicle: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteVehicle: () => ({ mutate: vi.fn(), isPending: false }),
  useRestoreVehicle: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../components/VehicleDetailUnitTab", () => ({
  VehicleDetailUnitTab: () => <div>Ficha</div>,
}));

vi.mock("../components/VehicleDetailDocumentsTab", () => ({
  VehicleDetailDocumentsTab: () => <div>Documentos</div>,
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return { ...mod, useToast: () => ({ toast: vi.fn() }) };
});

vi.mock("@features/catalogs", () => ({
  CatalogTypeCode: {
    SAT_TIPO_PERMISO: "sat_tipo_permiso",
    SAT_CONFIG_AUTOTRANSPORTE: "sat_config_autotransporte",
  },
  useCatalogOptions: () => ({
    data: [{ code: "T3S2", name: "Tractocamión Semirremolque" }],
    isLoading: false,
  }),
}));

const FAR_FUTURE = "2099-12-31";

function buildVehicle(
  overrides: Partial<Vehicle> = {},
  cartaPorte: Partial<Vehicle["cartaPorte"]> = {},
  documentation: Partial<Vehicle["documentation"]> = {},
): Vehicle {
  return {
    id: "v-1",
    tenantId: "t-1",
    unitNumber: "T-12",
    licensePlate: "ABC1234",
    vin: null,
    brand: "Kenworth",
    model: "T680",
    year: 2024,
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
      insuranceExpiry: FAR_FUTURE,
      sctPermitNumber: "SCT-1",
      sctPermitExpiry: FAR_FUTURE,
      ...documentation,
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
      satConfigAutotransporteCode: "T3S2",
      pesoBrutoVehicular: 20,
      insuranceCompany: "AXA",
      aseguraMedioAmbiente: null,
      polizaMedioAmbiente: null,
      aseguraCarga: null,
      polizaCarga: null,
      ...cartaPorte,
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

function renderDetail(vehicle: Vehicle) {
  mockUseVehicle.mockReturnValue({
    data: vehicle,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
  const router = createMemoryRouter(
    [{ path: "/vehicles/:id", element: <VehicleDetailPage /> }],
    { initialEntries: ["/vehicles/v-1"] },
  );
  return render(<RouterProvider router={router} />);
}

const cCopy = vehiclesCopy.detail.coherenceAlert;
const dCopy = vehiclesCopy.detail.alert;

describe("VehicleDetailPage — aviso soft tipo ↔ ConfigVehicular (D4)", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(() => true);
  });

  it("CA3: tortón con T3S2 → alerta warning con tipo, código – etiqueta y familia", () => {
    renderDetail(buildVehicle());

    expect(screen.getByText(cCopy.title)).toBeInTheDocument();
    const body = screen.getByText(cCopy.title).parentElement as HTMLElement;
    expect(body).toHaveTextContent("Tortón");
    expect(body).toHaveTextContent("T3S2 – Tractocamión Semirremolque");
    expect(body).toHaveTextContent(
      vehiclesCopy.typeConfigCoherence.familyLabel.tracto,
    );
    expect(body).toHaveTextContent(cCopy.bodyTail);
  });

  it("CA5: con vehicles.update el CTA abre la edición en la sección Carta Porte", () => {
    renderDetail(buildVehicle());

    expect(screen.getByRole("link", { name: cCopy.cta })).toHaveAttribute(
      "href",
      "/vehicles/v-1/edit#vehicle-edit-carta-porte",
    );
  });

  it("CA5: sin vehicles.update la alerta se muestra sin CTA", () => {
    mockHasPermission.mockImplementation(() => false);
    renderDetail(buildVehicle());

    expect(screen.getByText(cCopy.title)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: cCopy.cta }),
    ).not.toBeInTheDocument();
  });

  it("CA4: docs + coherencia → dos cards, documentos arriba", () => {
    renderDetail(buildVehicle({}, {}, { insuranceExpiry: null }));

    const docsTitle = screen.getByText(dCopy.documentsMissingTitle);
    const coherenceTitle = screen.getByText(cCopy.title);
    expect(
      docsTitle.compareDocumentPosition(coherenceTitle) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("CA4: unidad dada de baja → sin alerta de coherencia", () => {
    renderDetail(
      buildVehicle({
        isActive: false,
        deactivatedAt: "2026-10-08T18:00:00.000Z",
      } as Partial<Vehicle>),
    );

    expect(screen.getByTestId("vehicle-deactivated-alert")).toBeInTheDocument();
    expect(screen.queryByText(cCopy.title)).not.toBeInTheDocument();
  });

  it.each([
    ["truck coherente", "truck", "T3S2"],
    ["pickup + C2", "pickup", "C2"],
    ["utility", "utility", "T3S2"],
    ["OTRO*", "torton", "OTROSG"],
    ["GPL*", "torton", "GPLUTA"],
    ["config vacía", "torton", null],
  ])("CA6: %s → sin aviso", (_label, type, code) => {
    renderDetail(
      buildVehicle(
        { type } as Partial<Vehicle>,
        { satConfigAutotransporteCode: code },
      ),
    );

    expect(screen.queryByText(cCopy.title)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: cCopy.cta }),
    ).not.toBeInTheDocument();
  });

  it("CA8: el copy no afirma prohibición SAT ni habla de error", () => {
    const strings = [
      cCopy.title,
      cCopy.bodyLead,
      cCopy.bodyConfig,
      cCopy.bodyFamily,
      cCopy.bodyTail,
      cCopy.cta,
      vehiclesCopy.form.hint.typeConfigCoherence.lead,
      vehiclesCopy.form.hint.typeConfigCoherence.usual,
      vehiclesCopy.form.hint.typeConfigCoherence.here,
      vehiclesCopy.form.hint.typeConfigCoherence.tail,
      vehiclesCopy.form.hint.reviewTypeMismatch("Tortón"),
      ...Object.values(vehiclesCopy.typeConfigCoherence.expectedByType),
      ...Object.values(vehiclesCopy.typeConfigCoherence.familyLabel),
    ];
    for (const s of strings) {
      expect(s).not.toMatch(/SAT no permite/i);
      expect(s).not.toMatch(/inv[aá]lid/i);
      expect(s).not.toMatch(/incorrect/i);
      expect(s).not.toMatch(/\berror\b/i);
    }
  });
});
