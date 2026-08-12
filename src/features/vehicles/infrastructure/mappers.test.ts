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
    expect(item.remolques).toEqual([]);
    expect(item.pesoBrutoVehicular).toBeNull();
    expect(item.insuranceCompany).toBeNull();
  });

  it("maps CP list fields and remolques", () => {
    const item = mapVehicleListItem({
      id: "v2",
      unit_number: "U-02",
      license_plate: "XYZ5678",
      brand: "Volvo",
      model: "VNL",
      year: 2023,
      type: "truck",
      color: null,
      status: "available",
      current_mileage: 0,
      is_active: true,
      insurance_policy: "POL-1",
      insurance_expiry: "2030-01-01",
      sct_permit_number: "SCT-1",
      sct_permit_expiry: "2030-01-01",
      sat_tipo_permiso_code: "TPAF01",
      sat_config_autotransporte_code: "T3S2",
      peso_bruto_vehicular: 30,
      insurance_company: "GNP",
      remolques: [
        {
          position: 1,
          sat_sub_tipo_rem_code: "CTR001",
          license_plate: "REM1234",
        },
      ],
    });

    expect(item.pesoBrutoVehicular).toBe(30);
    expect(item.insuranceCompany).toBe("GNP");
    expect(item.remolques).toEqual([
      {
        position: 1,
        satSubTipoRemCode: "CTR001",
        licensePlate: "REM1234",
      },
    ]);
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
