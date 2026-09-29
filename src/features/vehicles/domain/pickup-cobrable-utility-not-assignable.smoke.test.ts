/**
 * Regresión web: Camioneta cobrable + Utilitario no asignable a viajes.
 */
import { describe, expect, it } from "vitest";
import {
  isBillableMotrizNow,
  isBillableMotrizType,
  isTripAssignableVehicleType,
} from "@features/vehicles/domain";
import { classifyVehicleForAssignment } from "@features/vehicles/application/hooks/useVehicles";
import type { VehicleListItem } from "@features/vehicles/domain";
import { vehiclesCopy } from "@features/vehicles/presentation/copy/vehiclesCopy";

function vehicle(
  overrides: Partial<VehicleListItem> & Pick<VehicleListItem, "id" | "type">,
): VehicleListItem {
  return {
    unitNumber: "U-001",
    licensePlate: "ABC1234",
    brand: "Freightliner",
    model: "Cascadia",
    year: 2022,
    color: null,
    status: "available",
    currentMileage: 0,
    isActive: true,
    insurancePolicy: "POL-001",
    insuranceExpiry: "2030-01-01",
    sctPermitNumber: "SCT-001",
    sctPermitExpiry: "2030-01-01",
    satTipoPermisoCode: "TPAF01",
    satConfigAutotransporteCode: "C2",
    pesoBrutoVehicular: 25,
    insuranceCompany: "GNP",
    remolques: [],
    branchId: null,
    branchName: null,
    branchCode: null,
    ...overrides,
  };
}

describe("smoke · pickup cobrable + utility no asignable (web)", () => {
  it("camioneta es cobrable y el copy de alta la nombra", () => {
    expect(isBillableMotrizType("pickup")).toBe(true);
    expect(
      isBillableMotrizNow({
        type: "pickup",
        status: "available",
        isActive: true,
      }),
    ).toBe(true);
    expect(vehiclesCopy.billingPolicy.create).toMatch(/camioneta/i);
  });

  it("camioneta clasifica como asignable a viaje", () => {
    expect(isTripAssignableVehicleType("pickup")).toBe(true);
    const result = classifyVehicleForAssignment(
      vehicle({ id: "veh-pickup", type: "pickup" }),
    );
    expect(result.canBeAssigned).toBe(true);
  });

  it("utilitario no es cobrable ni asignable", () => {
    expect(isBillableMotrizType("utility")).toBe(false);
    expect(isTripAssignableVehicleType("utility")).toBe(false);
    const result = classifyVehicleForAssignment(
      vehicle({ id: "veh-utility", type: "utility" }),
    );
    expect(result.canBeAssigned).toBe(false);
    expect(result.blockReason).toMatch(/utilitario/i);
  });
});
