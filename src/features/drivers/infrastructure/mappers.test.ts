import { describe, expect, it } from "vitest";
import { mapDriver, mapDriverListItemsResponse } from "./mappers";

const dualLicenseFields = {
  federal_license_number: "LIC-FED-1",
  federal_license_category: "E",
  federal_license_expiry: "2027-01-01",
  state_license_number: null,
  state_license_expiry: null,
  state_issuing_state: null,
  has_federal_license: true,
  has_state_license: false,
  is_federal_license_expired: false,
  is_state_license_expired: false,
  is_license_expired: false,
} as const;

describe("driver mappers — branch fields", () => {
  const employee = {
    id: "emp-1",
    employee_number: "E-001",
    first_name: "Juan",
    last_name: "Pérez",
    second_last_name: null,
    full_name: "Juan Pérez",
    email: null,
    phone: null,
    mobile_phone: null,
    curp: null,
    rfc: null,
    branch_id: "branch-1",
    branch_name: "Matriz",
    branch_code: "MTZ",
  };

  it("maps branch fields on list items", () => {
    const drivers = mapDriverListItemsResponse({
      data: [
        {
          id: "d1",
          tenant_id: "t1",
          employee_id: "emp-1",
          employee,
          ...dualLicenseFields,
          status: "available",
          years_of_experience: 5,
          total_trips: 10,
          is_active: true,
          created_at: "2026-01-01T00:00:00.000Z",
          branch_id: "branch-1",
          branch_name: "Matriz",
          branch_code: "MTZ",
        },
      ],
    });

    expect(drivers[0]?.branchId).toBe("branch-1");
    expect(drivers[0]?.federalLicenseNumber).toBe("LIC-FED-1");
    expect(drivers[0]?.employee.branchName).toBe("Matriz");
    expect(drivers[0]?.employee.branchCode).toBe("MTZ");
  });

  it("maps branch fields on detail", () => {
    const result = mapDriver({
      data: {
        id: "d1",
        tenant_id: "t1",
        employee_id: "emp-1",
        employee,
        ...dualLicenseFields,
        medical_certificate_number: null,
        medical_certificate_expiry: null,
        medical_certificate_issuer: null,
        psychometric_test_date: null,
        psychometric_test_result: null,
        last_drug_test_date: null,
        drug_test_result: null,
        assigned_device_id: null,
        status: "available",
        is_active: true,
        years_of_experience: 5,
        blood_type: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        emergency_contact_relationship: null,
        notes: null,
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

    expect(result.data.branchId).toBe("branch-1");
    expect(result.data.federalLicenseCategory).toBe("E");
    expect(result.data.employee?.branchCode).toBe("MTZ");
  });
});
