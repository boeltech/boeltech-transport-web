/**
 * Employee Mappers
 * Clean Architecture - Infrastructure Layer
 *
 * Transforma datos entre API (snake_case) y dominio (camelCase).
 */

import type {
  ApiEmployeeListItem,
  ApiEmployeeResponse,
  ApiEmployeeForDriverSelection,
  EmployeeListItem,
  Employee,
  EmployeeForSelection,
  Gender,
} from "../domain/entities";
import type {
  MappedPaginatedResult,
  ApiPaginatedResponse,
  MappedSingleResult,
  ApiSingleResponse,
} from "@shared/api";

// ============================================================================
// API → DOMAIN
// ============================================================================

/**
 * Normaliza género desde API a valores del dominio ("M" | "F").
 * En BD suele persistirse como una sola letra **M** o **F** (también acepta `m`/`f`).
 * El UI (`GENDER_OPTIONS`) y Zod solo reconocen esos dos códigos; otras cadenas legacy
 * se mapean cuando es posible; si no, retorna `null` (equivalente a “sin especificar”).
 */
function parseGenderFromApi(raw: Gender | string | null | undefined): Gender | null {
  if (raw == null) return null;
  const v = String(raw).trim();
  if (!v) return null;
  const u = v.toUpperCase();
  const lower = v.toLowerCase();

  if (u === "M") return "M";
  if (u === "F") return "F";

  if (
    u === "H" ||
    lower === "male" ||
    lower === "masculino" ||
    lower === "hombre"
  ) {
    return "M";
  }
  if (lower === "female" || lower === "femenino" || lower === "mujer") {
    return "F";
  }
  return null;
}

function mapListItemToDomain(raw: ApiEmployeeListItem): EmployeeListItem {
  return {
    id: raw.id,
    employeeNumber: raw.employee_number,
    firstName: raw.first_name,
    lastName: raw.last_name,
    secondLastName: raw.second_last_name,
    fullName: raw.full_name,
    gender: parseGenderFromApi(raw.gender),
    department: raw.department,
    position: raw.position,
    employmentType: raw.employment_type,
    hireDate: raw.hire_date,
    status: raw.status,
    isActive: raw.is_active,
    email: raw.email,
    phone: raw.phone,
  };
}

function mapEmployeeToDomain(raw: ApiEmployeeResponse): Employee {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    employeeNumber: raw.employee_number,
    firstName: raw.first_name,
    lastName: raw.last_name,
    secondLastName: raw.second_last_name,
    fullName: raw.full_name,
    birthDate: raw.birth_date,
    gender: parseGenderFromApi(raw.gender),
    maritalStatus: raw.marital_status,
    nationality: raw.nationality,
    birthPlace: raw.birth_place,
    curp: raw.curp,
    rfc: raw.rfc,
    nss: raw.nss,
    infonavitNumber: raw.infonavit_number,
    email: raw.email,
    phone: raw.phone,
    mobilePhone: raw.mobile_phone,
    personalAddress: null,
    street: raw.street,
    exteriorNumber: raw.exterior_number,
    interiorNumber: raw.interior_number,
    neighborhood: raw.neighborhood,
    city: raw.city,
    state: raw.state,
    postalCode: raw.postal_code,
    country: raw.country,
    emergencyContactName: raw.emergency_contact_name,
    emergencyContactPhone: raw.emergency_contact_phone,
    emergencyContactRelationship: raw.emergency_contact_relationship,
    hireDate: raw.hire_date,
    terminationDate: raw.termination_date,
    terminationReason: raw.termination_reason,
    employmentType: raw.employment_type,
    department: raw.department,
    position: raw.position,
    jobTitle: raw.job_title,
    reportsTo: raw.reports_to,
    workLocation: raw.work_location,
    branchId: raw.branch_id,
    branchName: raw.branch_name,
    branchCode: raw.branch_code,
    baseSalary: raw.base_salary,
    salaryType: raw.salary_type,
    paymentMethod: raw.payment_method,
    bankName: raw.bank_name,
    bankAccountNumber: raw.bank_account_number,
    bankClabe: raw.bank_clabe,
    status: raw.status,
    isActive: raw.is_active,
    bloodType: raw.blood_type,
    medicalNotes: raw.medical_notes,
    photoUrl: raw.photo_url,
    notes: raw.notes,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    createdBy: raw.created_by,
    updatedBy: raw.updated_by,
    createdByName: raw.created_by_name ?? null,
    updatedByName: raw.updated_by_name ?? null,
    driverRole: raw.driver_role
      ? {
          driverId: raw.driver_role.driver_id,
          driverStatus: raw.driver_role.driver_status,
          activeTripCount: raw.driver_role.active_trip_count,
          activeTripCodes: raw.driver_role.active_trip_codes,
          blocksEmployeeTermination: raw.driver_role.blocks_employee_termination,
        }
      : null,
  };
}

export function mapApiToEmployeeForSelection(
  raw: ApiEmployeeForDriverSelection,
): EmployeeForSelection {
  return {
    id: raw.id,
    employeeNumber: raw.employee_number,
    firstName: raw.first_name,
    lastName: raw.last_name,
    secondLastName: raw.second_last_name,
    fullName: raw.full_name,
    department: raw.department,
    position: raw.position,
    hireDate: raw.hire_date,
  };
}

export function mapApiToEmployeeList(
  raw: ApiEmployeeForDriverSelection[],
): EmployeeForSelection[] {
  return raw.map(mapApiToEmployeeForSelection);
}

// ============================================================================
// PUBLIC MAPPERS
// ============================================================================

export function mapPaginatedEmployees(
  response: ApiPaginatedResponse<ApiEmployeeListItem>,
): MappedPaginatedResult<EmployeeListItem> {
  return {
    data: response.data.map(mapListItemToDomain),
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    },
  };
}

export function mapEmployee(
  response: ApiSingleResponse<ApiEmployeeResponse>,
): MappedSingleResult<Employee> {
  return {
    data: mapEmployeeToDomain(response.data),
    message: response.message,
  };
}
