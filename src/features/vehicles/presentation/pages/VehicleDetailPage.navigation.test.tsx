import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { VehicleDetailPage } from "./VehicleDetailPage";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { Vehicle } from "../../domain";

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
  VehicleDetailDocumentsTab: () => <div>Documentos panel</div>,
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
      insurancePolicy: "POL-1",
      insuranceExpiry: "2099-12-31",
      sctPermitNumber: "SCT-1",
      sctPermitExpiry: "2099-12-31",
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

function renderAt(
  path: string,
  state?: { from: string; fromLabel?: string },
) {
  const router = createMemoryRouter(
    [{ path: "/vehicles/:id", element: <VehicleDetailPage /> }],
    { initialEntries: [{ pathname: path, state }] },
  );
  return render(<RouterProvider router={router} />);
}

describe("VehicleDetailPage navigation (F2 / NL)", () => {
  beforeEach(() => {
    mockHasPermission.mockReturnValue(true);
    mockUseVehicle.mockReturnValue({
      data: buildVehicle(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("desde listado con filtros: migas Vehículos(?q) › T-12; sin flecha", () => {
    renderAt("/vehicles/v-1", { from: "/vehicles?status=available&page=2" });

    const nav = screen.getByRole("navigation", { name: "Migas" });
    expect(nav).toHaveTextContent("Vehículos");
    expect(nav).toHaveTextContent("T-12");
    expect(screen.getByRole("link", { name: "Vehículos" })).toHaveAttribute(
      "href",
      "/vehicles?status=available&page=2",
    );
    expect(
      screen.queryByRole("button", { name: /volver/i }),
    ).not.toBeInTheDocument();
  });

  it("desde viaje: migas Viajes › TRP-… › T-12", () => {
    renderAt("/vehicles/v-1", {
      from: "/trips/trip-9",
      fromLabel: "TRP-2401",
    });

    const nav = screen.getByRole("navigation", { name: "Migas" });
    expect(nav).toHaveTextContent("Viajes");
    expect(nav).toHaveTextContent("TRP-2401");
    expect(nav).toHaveTextContent("T-12");
    expect(screen.getByRole("link", { name: "TRP-2401" })).toHaveAttribute(
      "href",
      "/trips/trip-9",
    );
  });

  it("primer tab es «Datos» (NL7)", () => {
    renderAt("/vehicles/v-1");

    expect(
      screen.getByRole("tab", { name: vehiclesCopy.detail.tab.unit }),
    ).toHaveTextContent("Datos");
  });

  it("sin state.from: jerarquía Vehículos › T-12", () => {
    renderAt("/vehicles/v-1");

    const link = screen.getByRole("link", { name: "Vehículos" });
    expect(link).toHaveAttribute("href", "/vehicles");
  });
});
