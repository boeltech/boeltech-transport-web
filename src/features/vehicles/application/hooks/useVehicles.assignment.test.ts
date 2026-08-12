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
    type: "truck",
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

  it("allows assignment when stamp-ready and docs OK", () => {
    const result = classifyVehicleForAssignment(vehicle({ id: "veh-ok" }));
    expect(result.canBeAssigned).toBe(true);
  });

  it("blocks incomplete Autotransporte (missing config)", () => {
    const result = classifyVehicleForAssignment(
      vehicle({ id: "veh-5", satConfigAutotransporteCode: null }),
    );
    expect(result.canBeAssigned).toBe(false);
    expect(result.blockReason).toBeTruthy();
    expect(
      "expiredDocsOverridable" in result ? result.expiredDocsOverridable : undefined,
    ).toBeUndefined();
  });

  it("blocks Config S/R without remolques", () => {
    const result = classifyVehicleForAssignment(
      vehicle({
        id: "veh-6",
        satConfigAutotransporteCode: "T3S2",
        remolques: [],
      }),
    );
    expect(result.canBeAssigned).toBe(false);
    expect(String(result.blockReason).toLowerCase()).toMatch(/remolque/);
  });

  it("allows Config S/R with remolque", () => {
    const result = classifyVehicleForAssignment(
      vehicle({
        id: "veh-7",
        satConfigAutotransporteCode: "T3S2",
        remolques: [
          {
            position: 1,
            satSubTipoRemCode: "CTR001",
            licensePlate: "REM1234",
          },
        ],
      }),
    );
    expect(result.canBeAssigned).toBe(true);
  });
});
