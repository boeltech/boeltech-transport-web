import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { VehicleDetailPage } from "./VehicleDetailPage";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { Vehicle } from "../../domain";

/**
 * Alta progresiva (PRD D1): la vigencia del seguro RC y del permiso SCT siguen
 * siendo opcionales al guardar, pero la ficha avisa cuando faltan porque sin
 * ellas la unidad no se asigna a viajes (paridad con el clasificador ADR-0066).
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

const FAR_FUTURE = "2099-12-31";

function buildVehicle(
  documentation: Partial<Vehicle["documentation"]> = {},
  overrides: Partial<Vehicle> = {},
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
    cartaPorte: {} as Vehicle["cartaPorte"],
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

const aCopy = vehiclesCopy.detail.alert;

/** El `<li>` de la `DetailAlertCard` cuyo label coincide con el documento. */
function alertItem(label: string) {
  const title =
    screen.queryByText(aCopy.documentsMissingTitle) ??
    screen.queryByText(aCopy.documentsExpiredTitle) ??
    screen.getByText(aCopy.documentsExpiringTitle);
  const body = title.parentElement as HTMLElement;
  const items = within(body).getAllByRole("listitem");
  const item = items.find((li) => li.textContent?.includes(`${label}:`));
  if (!item) throw new Error(`No hay ítem de alerta para ${label}`);
  return item;
}

describe("VehicleDetailPage — alerta de documentos faltantes (alta progresiva)", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(() => true);
  });

  it("CA1: póliza sin fecha → alerta crítica con Seguro RC «Sin fecha de vencimiento»", () => {
    renderDetail(buildVehicle({ insuranceExpiry: null }));

    expect(screen.getByText(aCopy.documentsMissingTitle)).toBeInTheDocument();
    expect(alertItem(aCopy.insuranceLabel)).toHaveTextContent(aCopy.noExpiry);
    // El permiso SCT está completo: no aparece en la lista.
    expect(
      screen.queryByText(`${aCopy.sctLabel}:`),
    ).not.toBeInTheDocument();
    // CTAs iguales a hoy.
    expect(
      screen.getByRole("button", { name: aCopy.goToDocuments }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: aCopy.goToEdit })).toHaveAttribute(
      "href",
      "/vehicles/v-1/edit",
    );
  });

  it("CA2: sin póliza ni fecha → Seguro RC «No registrado»", () => {
    renderDetail(buildVehicle({ insurancePolicy: null, insuranceExpiry: null }));

    expect(screen.getByText(aCopy.documentsMissingTitle)).toBeInTheDocument();
    expect(alertItem(aCopy.insuranceLabel)).toHaveTextContent(
      aCopy.notRegistered,
    );
  });

  it("permiso SCT con número y sin fecha → ítem «Sin fecha de vencimiento»", () => {
    renderDetail(buildVehicle({ sctPermitExpiry: null }));

    expect(alertItem(aCopy.sctLabel)).toHaveTextContent(aCopy.noExpiry);
  });

  it("faltante + vencido conviven en la misma alerta con título de faltantes", () => {
    renderDetail(
      buildVehicle({ insuranceExpiry: null, sctPermitExpiry: "2020-01-01" }),
    );

    expect(screen.getByText(aCopy.documentsMissingTitle)).toBeInTheDocument();
    expect(alertItem(aCopy.insuranceLabel)).toHaveTextContent(aCopy.noExpiry);
    expect(alertItem(aCopy.sctLabel)).toHaveTextContent(aCopy.expired);
    expect(
      screen.queryByText(aCopy.documentsExpiredTitle),
    ).not.toBeInTheDocument();
  });

  it("solo vencidos conserva el título «Documentos vencidos»", () => {
    renderDetail(buildVehicle({ insuranceExpiry: "2020-01-01" }));

    expect(screen.getByText(aCopy.documentsExpiredTitle)).toBeInTheDocument();
    expect(
      screen.queryByText(aCopy.documentsMissingTitle),
    ).not.toBeInTheDocument();
  });

  it("CA3: ambas fechas a más de 30 días → sin alerta de documentos", () => {
    renderDetail(buildVehicle());

    expect(
      screen.queryByText(aCopy.documentsMissingTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(aCopy.documentsExpiredTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(aCopy.documentsExpiringTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: aCopy.goToDocuments }),
    ).not.toBeInTheDocument();
  });

  it("CA4: unidad dada de baja con datos faltantes → sin alerta de documentos", () => {
    renderDetail(
      buildVehicle(
        {
          insurancePolicy: null,
          insuranceExpiry: null,
          sctPermitNumber: null,
          sctPermitExpiry: null,
        },
        { isActive: false, deactivatedAt: "2026-10-08T18:00:00.000Z" },
      ),
    );

    expect(screen.getByTestId("vehicle-deactivated-alert")).toBeInTheDocument();
    expect(
      screen.queryByText(aCopy.documentsMissingTitle),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(aCopy.notRegistered)).not.toBeInTheDocument();
  });

  it("sin vehicles.update la alerta no ofrece «Editar unidad»", () => {
    mockHasPermission.mockImplementation(() => false);
    renderDetail(buildVehicle({ insuranceExpiry: null }));

    expect(screen.getByText(aCopy.documentsMissingTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: aCopy.goToEdit }),
    ).not.toBeInTheDocument();
  });
});
