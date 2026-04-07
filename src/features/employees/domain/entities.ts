/**
 * Employee Domain Entities
 * Clean Architecture - Domain Layer
 */

// ============================================================================
// ENUMS / VALUE TYPES
// ============================================================================

export type EmployeeStatus =
  | "active"
  | "on_leave"
  | "on_vacation"
  | "suspended"
  | "terminated";

export type EmploymentType = "permanent" | "temporary" | "contractor";

export type Gender = "M" | "F";

export type MaritalStatus =
  | "single"
  | "married"
  | "divorced"
  | "widowed"
  | "cohabiting";

export type PaymentMethod = "bank_transfer" | "check" | "cash";

export type SalaryType = "monthly" | "biweekly" | "weekly" | "daily";

// ============================================================================
// API RESPONSE TYPES (snake_case del backend)
// ============================================================================

export interface ApiEmployeeListItem {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  second_last_name: string | null;
  full_name: string;
  gender: Gender | null;
  department: string | null;
  position: string | null;
  employment_type: EmploymentType;
  hire_date: string;
  status: EmployeeStatus;
  is_active: boolean;
  email: string | null;
  phone: string | null;
}

export interface ApiEmployeeResponse {
  id: string;
  tenant_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  second_last_name: string | null;
  full_name: string;
  birth_date: string | null;
  gender: Gender | null;
  marital_status: MaritalStatus | null;
  nationality: string | null;
  birth_place: string | null;
  curp: string | null;
  rfc: string | null;
  nss: string | null;
  infonavit_number: string | null;
  email: string | null;
  phone: string | null;
  mobile_phone: string | null;
  street: string | null;
  exterior_number: string | null;
  interior_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  hire_date: string;
  termination_date: string | null;
  termination_reason: string | null;
  employment_type: EmploymentType;
  department: string | null;
  position: string | null;
  job_title: string | null;
  reports_to: string | null;
  work_location: string | null;
  base_salary: number | null;
  salary_type: SalaryType | null;
  payment_method: PaymentMethod | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_clabe: string | null;
  status: EmployeeStatus;
  is_active: boolean;
  blood_type: string | null;
  medical_notes: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

/** Tipo para el selector de driver (endpoint legacy) */
export interface ApiEmployeeForDriverSelection {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  second_last_name: string | null;
  full_name: string;
  department: string | null;
  position: string | null;
  hire_date: string;
}

// ============================================================================
// DOMAIN TYPES (camelCase, uso interno)
// ============================================================================

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  fullName: string;
  gender: Gender | null;
  department: string | null;
  position: string | null;
  employmentType: EmploymentType;
  hireDate: string;
  status: EmployeeStatus;
  isActive: boolean;
  email: string | null;
  phone: string | null;
}

export interface Employee {
  id: string;
  tenantId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  fullName: string;
  birthDate: string | null;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  nationality: string | null;
  birthPlace: string | null;
  curp: string | null;
  rfc: string | null;
  nss: string | null;
  infonavitNumber: string | null;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  street: string | null;
  exteriorNumber: string | null;
  interiorNumber: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  hireDate: string;
  terminationDate: string | null;
  terminationReason: string | null;
  employmentType: EmploymentType;
  department: string | null;
  position: string | null;
  jobTitle: string | null;
  reportsTo: string | null;
  workLocation: string | null;
  baseSalary: number | null;
  salaryType: SalaryType | null;
  paymentMethod: PaymentMethod | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankClabe: string | null;
  status: EmployeeStatus;
  isActive: boolean;
  bloodType: string | null;
  medicalNotes: string | null;
  photoUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

/** Empleado para selector de driver */
export interface EmployeeForSelection {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  secondLastName: string | null;
  fullName: string;
  department: string | null;
  position: string | null;
  hireDate: string;
}

// ============================================================================
// FILTERS & PAGINATION
// ============================================================================

export interface EmployeeFilters {
  search?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  department?: string;
  isActive?: boolean;
}

export interface EmployeeSearchParams {
  search?: string;
}

// ============================================================================
// DTOs (para requests)
// ============================================================================

export interface CreateEmployeeDTO {
  first_name: string;
  last_name: string;
  second_last_name?: string;
  birth_date?: string;
  gender?: Gender;
  marital_status?: MaritalStatus;
  nationality?: string;
  birth_place?: string;
  curp?: string;
  rfc?: string;
  nss?: string;
  infonavit_number?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  hire_date: string;
  employment_type?: EmploymentType;
  department?: string;
  position?: string;
  job_title?: string;
  reports_to?: string;
  work_location?: string;
  base_salary?: number;
  salary_type?: SalaryType;
  payment_method?: PaymentMethod;
  bank_name?: string;
  bank_account_number?: string;
  bank_clabe?: string;
  blood_type?: string;
  medical_notes?: string;
  notes?: string;
}

export type UpdateEmployeeDTO = Partial<CreateEmployeeDTO> & {
  status?: EmployeeStatus;
  is_active?: boolean;
};

export interface TerminateEmployeeDTO {
  termination_date: string;
  termination_reason?: string;
}
