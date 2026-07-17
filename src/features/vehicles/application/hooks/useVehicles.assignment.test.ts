import { describe, expect, it } from "vitest";

import type { VehicleListItem } from "@features/vehicles/domain";
import { classifyVehicleForAssignment } from "@features/vehicles/application/hooks/useVehicles";

function vehicle(
  overrides: Partial<VehicleListItem> & Pick<VehicleListItem, "id">,
): VehicleListItem {
  return {
    unitNumber: "U-001",
    licensePlate: "ABC1234",
    brand: "Freightliner",
    model: "Cascadia",
    year: 2022,
    type: "tractor",
    color: null,
    status: "available",
    currentMileage: 0,
    isActive: true,
    insurancePolicy: "POL-001",
    insuranceExpiry: "2030-01-01",
    sctPermitNumber: "SCT-001",
    sctPermitExpiry: "2030-01-01",
    satTipoPermisoCode: null,
    satConfigAutotransporteCode: null,
    branchId: null,
    branchName: null,
    branchCode: null,
    ...overrides,
  } as VehicleListItem;
}

describe("classifyVehicleForAssignment", () => {
  it("marks expired insurance as overridable", () => {
    const result = classifyVehicleForAssignment(
      vehicle({ id: "veh-1", insuranceExpiry: "2020-01-01" }),
    );

    expect(result).toMatchObject({
      canBeAssigned: false,
      blockReason: "Seguro vencido",
      expiredDocsOverridable: true,
    });
  });

  it("marks expired SCT permit as overridable", () => {
    const result = classifyVehicleForAssignment(
      vehicle({ id: "veh-2", sctPermitExpiry: "2020-01-01" }),
    );

    expect(result).toMatchObject({
      canBeAssigned: false,
      blockReason: "Permiso SCT vencido",
      expiredDocsOverridable: true,
    });
  });

  it("does not mark missing insurance as overridable", () => {
    const result = classifyVehicleForAssignment(
      vehicle({
        id: "veh-3",
        insurancePolicy: null,
        insuranceExpiry: null,
      }),
    );

    expect(result).toMatchObject({
      canBeAssigned: false,
      blockReason: "Seguro no registrado",
    });
    expect(
      "expiredDocsOverridable" in result ? result.expiredDocsOverridable : undefined,
    ).toBeUndefined();
  });

  it("does not mark unavailable status as overridable", () => {
    const result = classifyVehicleForAssignment(
      vehicle({ id: "veh-4", status: "on_trip" }),
    );

    expect(result.canBeAssigned).toBe(false);
    expect(
      "expiredDocsOverridable" in result ? result.expiredDocsOverridable : undefined,
    ).toBeUndefined();
  });
});
