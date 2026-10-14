import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { VehicleDetailPage } from "./VehicleDetailPage";
import { EditVehiclePage } from "./EditVehiclePage";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { Vehicle } from "../../domain";

const { mockUseVehicle, mockHasPermission } = vi.hoisted(() => ({
  mockUseVehicle: vi.fn(),
  mockHasPermission: vi.fn(() => true),
}));

vi.mock("@features/vehicles/application", () => ({
  useVehicle: (...args: unknown[]) => mockUseVehicle(...args),
  useUpdateVehicle: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteVehicle: () => ({ mutate: vi.fn(), isPending: false }),
  useRestoreVehicle: () => ({ mutate: vi.fn(), isPending: false }),
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

vi.mock("../components/VehicleForm", () => ({
  VehicleForm: () => <form aria-label="Formulario de unidad" />,
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return { ...mod, useToast: () => ({ toast: vi.fn() }) };
});

function buildVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
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
      insurancePolicy: null,
      insuranceExpiry: "2020-01-01",
      sctPermitNumber: null,
      sctPermitExpiry: "2020-01-01",
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

const inactiveVehicle = () =>
  buildVehicle({
    isActive: false,
    deactivatedAt: "2026-10-08T18:00:00.000Z",
    deactivatedBy: "u-1",
    deactivatedByName: "Gerardo Méndez",
    deactivationReasonCode: "venta",
    deactivationNote: "Vendida a Transportes X",
  });

function renderAt(path: string) {
  // Data router required: EditVehiclePage uses useUnsavedChangesGuard → useBlocker.
  const router = createMemoryRouter(
    [
      { path: "/vehicles/:id", element: <VehicleDetailPage /> },
      { path: "/vehicles/:id/edit", element: <EditVehiclePage /> },
    ],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

const dCopy = vehiclesCopy.detail.deactivated;

describe("VehicleDetailPage — unidad dada de baja (D4)", () => {
  beforeEach(() => {
    mockHasPermission.mockImplementation(() => true);
  });

  it("muestra badge «Dada de baja», alerta con fecha/autor/motivo y oculta vencimientos", () => {
    mockUseVehicle.mockReturnValue({
      data: inactiveVehicle(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderAt("/vehicles/v-1");

    expect(
      screen.getByText(vehiclesCopy.lifecycle.deactivatedBadge),
    ).toBeInTheDocument();
    expect(screen.queryByText("Disponible")).not.toBeInTheDocument();

    const alert = screen.getByTestId("vehicle-deactivated-alert");
    expect(screen.getByText(dCopy.title)).toBeInTheDocument();
    expect(alert).toHaveTextContent("El 08 oct 2026 por Gerardo Méndez.");
    expect(alert).toHaveTextContent("Motivo: Venta — Vendida a Transportes X.");
    expect(alert).toHaveTextContent(dCopy.impact);

    expect(
      screen.queryByText(vehiclesCopy.detail.alert.documentsExpiredTitle),
    ).not.toBeInTheDocument();
  });

  it("solo ofrece «Restaurar» (sin Editar, Cambiar estado ni Dar de baja)", () => {
    mockUseVehicle.mockReturnValue({
      data: inactiveVehicle(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderAt("/vehicles/v-1");

    expect(
      screen.getByRole("button", { name: vehiclesCopy.restore.action }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editar/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /cambiar estado/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: vehiclesCopy.deactivate.action }),
    ).not.toBeInTheDocument();
  });

  it("sin vehicles.update no hay acciones en una unidad dada de baja", () => {
    mockHasPermission.mockImplementation(() => false);
    mockUseVehicle.mockReturnValue({
      data: inactiveVehicle(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderAt("/vehicles/v-1");

    expect(
      screen.queryByRole("button", { name: vehiclesCopy.restore.action }),
    ).not.toBeInTheDocument();
  });

  it("baja sin motivo registrado (legado) lo indica sin romper", () => {
    mockUseVehicle.mockReturnValue({
      data: buildVehicle({ isActive: false }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderAt("/vehicles/v-1");

    expect(screen.getByTestId("vehicle-deactivated-alert")).toHaveTextContent(
      `Motivo: ${dCopy.reasonNotRecorded}.`,
    );
  });

  it("una unidad activa conserva estado, alertas de documentos con CTA y «Dar de baja»", () => {
    mockUseVehicle.mockReturnValue({
      data: buildVehicle(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderAt("/vehicles/v-1");

    expect(
      screen.queryByText(vehiclesCopy.lifecycle.deactivatedBadge),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(vehiclesCopy.detail.alert.documentsExpiredTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: vehiclesCopy.detail.alert.goToDocuments,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: vehiclesCopy.detail.alert.goToEdit }),
    ).toHaveAttribute("href", "/vehicles/v-1/edit");
    expect(
      screen.getByRole("button", { name: vehiclesCopy.deactivate.action }),
    ).toBeInTheDocument();
  });

  it("/vehicles/:id/edit de una unidad dada de baja redirige al detalle", () => {
    mockUseVehicle.mockReturnValue({
      data: inactiveVehicle(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderAt("/vehicles/v-1/edit");

    expect(
      screen.queryByRole("form", { name: "Formulario de unidad" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("vehicle-deactivated-alert")).toBeInTheDocument();
  });
});
