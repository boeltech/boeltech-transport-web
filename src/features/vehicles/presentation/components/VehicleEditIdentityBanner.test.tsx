import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VehicleEditIdentityBanner } from "./VehicleEditIdentityBanner";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { Vehicle } from "../../domain";

function buildVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "v-9",
    tenantId: "t-1",
    unitNumber: "U-99",
    licensePlate: "XYZ9876",
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
    currentMileage: 0,
    documentation: {
      insurancePolicy: null,
      insuranceExpiry: null,
      sctPermitNumber: null,
      sctPermitExpiry: null,
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

describe("VehicleEditIdentityBanner (F1 D4)", () => {
  it("solo comunica inmutabilidad del número de unidad y CTA al detalle", () => {
    render(
      <MemoryRouter>
        <VehicleEditIdentityBanner vehicle={buildVehicle()} />
      </MemoryRouter>,
    );

    const copy = vehiclesCopy.form.edit.identityBanner;
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText("U-99")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.viewDetail }),
    ).toHaveAttribute("href", "/vehicles/v-9");

    // No duplica subtitle del shell (placa / tipo / marca)
    expect(screen.queryByText("XYZ9876")).not.toBeInTheDocument();
    expect(screen.queryByText(/Kenworth/)).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
