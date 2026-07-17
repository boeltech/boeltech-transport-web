import { describe, expect, it } from "vitest";
import { mapEmployee } from "./mappers";
import type { ApiEmployeeResponse } from "../domain/entities";

const BRANCH_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("mapEmployee branch fields", () => {
  it("maps branch_id, branch_name and branch_code to domain", () => {
    const apiEmployee: ApiEmployeeResponse = {
      id: "emp-1",
      tenant_id: "tenant-1",
      employee_number: "EMP-001",
      first_name: "Ana",
      last_name: "López",
      second_last_name: null,
      full_name: "Ana López",
      birth_date: null,
      gender: null,
      marital_status: null,
      nationality: null,
      birth_place: null,
      curp: null,
      rfc: null,
      nss: null,
      infonavit_number: null,
      email: null,
      phone: null,
      mobile_phone: null,
      street: null,
      exterior_number: null,
      interior_number: null,
      neighborhood: null,
      city: null,
      state: null,
      postal_code: null,
      country: null,
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      hire_date: "2026-01-01",
      termination_date: null,
      termination_reason: null,
      employment_type: "permanent",
      department: null,
      position: null,
      job_title: null,
      reports_to: null,
      work_location: "Matriz",
      branch_id: BRANCH_ID,
      branch_name: "Sucursal Centro",
      branch_code: "MTY-01",
      base_salary: null,
      salary_type: null,
      payment_method: null,
      bank_name: null,
      bank_account_number: null,
      bank_clabe: null,
      status: "active",
      is_active: true,
      blood_type: null,
      medical_notes: null,
      photo_url: null,
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      created_by: null,
      updated_by: null,
      created_by_name: null,
      updated_by_name: null,
    };

    const mapped = mapEmployee({ data: apiEmployee });

    expect(mapped.data.branchId).toBe(BRANCH_ID);
    expect(mapped.data.branchName).toBe("Sucursal Centro");
    expect(mapped.data.branchCode).toBe("MTY-01");
    expect(mapped.data.workLocation).toBe("Matriz");
  });
});
