import { describe, expect, it } from "vitest";
import { mapDriver, mapDriverListItemsResponse } from "./mappers";

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
          license_number: "LIC-1",
          license_type: "E",
          license_expiry: "2027-01-01",
          status: "available",
          years_of_experience: 5,
          total_trips: 10,
          is_license_expired: false,
          is_active: true,
          created_at: "2026-01-01T00:00:00.000Z",
          branch_id: "branch-1",
          branch_name: "Matriz",
          branch_code: "MTZ",
        },
      ],
    });

    expect(drivers[0]?.branchId).toBe("branch-1");
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
        license_number: "LIC-1",
        license_type: "E",
        license_expiry: "2027-01-01",
        license_issuing_state: null,
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
    expect(result.data.employee?.branchCode).toBe("MTZ");
  });
});
