import { describe, expect, it } from "vitest";
import {
  mapVehicleDetail,
  mapVehicleListItem,
  toApiCreateVehicle,
} from "./mappers";

describe("vehicle mappers — branch fields", () => {
  it("maps branch fields on list items", () => {
    const item = mapVehicleListItem({
      id: "v1",
      unit_number: "U-01",
      license_plate: "ABC1234",
      brand: "Kenworth",
      model: "T680",
      year: 2024,
      type: "truck",
      color: null,
      status: "available",
      current_mileage: 1000,
      is_active: true,
      insurance_expiry: null,
      sct_permit_expiry: null,
      sat_tipo_permiso_code: null,
      sat_config_autotransporte_code: null,
      branch_id: "branch-1",
      branch_name: "Matriz",
      branch_code: "MTZ",
    });

    expect(item.branchId).toBe("branch-1");
    expect(item.branchName).toBe("Matriz");
    expect(item.branchCode).toBe("MTZ");
  });

  it("maps branch fields on detail and create payload", () => {
    const detail = mapVehicleDetail({
      data: {
        id: "v1",
        tenant_id: "t1",
        unit_number: "U-01",
        license_plate: "ABC1234",
        vin: null,
        brand: "Kenworth",
        model: "T680",
        year: 2024,
        type: "truck",
        color: null,
        load_capacity: null,
        volume_capacity: null,
        fuel_tank_capacity: null,
        expected_fuel_efficiency: null,
        current_mileage: 0,
        insurance_policy: null,
        insurance_expiry: null,
        sct_permit_number: null,
        sct_permit_expiry: null,
        sat_tipo_permiso_code: null,
        sat_config_autotransporte_code: null,
        peso_bruto_vehicular: null,
        insurance_company: null,
        asegura_medio_ambiente: null,
        poliza_medio_ambiente: null,
        asegura_carga: null,
        poliza_carga: null,
        status: "available",
        is_active: true,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        created_by: null,
        updated_by: null,
        created_by_name: null,
        updated_by_name: null,
        branch_id: "branch-1",
        branch_name: "Matriz",
        branch_code: "MTZ",
      },
    });

    expect(detail.data.branchId).toBe("branch-1");
    expect(detail.data.branchName).toBe("Matriz");
    expect(detail.data.branchCode).toBe("MTZ");

    expect(
      toApiCreateVehicle({
        unitNumber: "U-01",
        licensePlate: "ABC1234",
        brand: "Kenworth",
        model: "T680",
        year: 2024,
        type: "truck",
        branchId: "branch-1",
      }),
    ).toMatchObject({
      branch_id: "branch-1",
    });
  });
});
