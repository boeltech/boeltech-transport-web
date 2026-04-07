import type {
  EmployeeStatus,
  EmploymentType,
  Gender,
  MaritalStatus,
  PaymentMethod,
  SalaryType,
} from "../../domain/entities";

// ============================================================================
// STATUS
// ============================================================================

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "Activo",
  on_leave: "Con permiso",
  on_vacation: "Vacaciones",
  suspended: "Suspendido",
  terminated: "Baja",
};

export const EMPLOYEE_STATUS_VARIANTS: Record<
  EmployeeStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  on_leave: "secondary",
  on_vacation: "secondary",
  suspended: "outline",
  terminated: "destructive",
};

// ============================================================================
// EMPLOYMENT TYPE
// ============================================================================

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  permanent: "Planta",
  temporary: "Eventual",
  contractor: "Contratista",
};

export const EMPLOYMENT_TYPE_OPTIONS = (
  Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]
).map((k) => ({ value: k, label: EMPLOYMENT_TYPE_LABELS[k] }));

// ============================================================================
// GENDER
// ============================================================================

export const GENDER_LABELS: Record<Gender, string> = {
  M: "Masculino",
  F: "Femenino",
};

export const GENDER_OPTIONS = (Object.keys(GENDER_LABELS) as Gender[]).map(
  (k) => ({ value: k, label: GENDER_LABELS[k] }),
);

// ============================================================================
// MARITAL STATUS
// ============================================================================

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  single: "Soltero(a)",
  married: "Casado(a)",
  divorced: "Divorciado(a)",
  widowed: "Viudo(a)",
  cohabiting: "Unión libre",
};

export const MARITAL_STATUS_OPTIONS = (
  Object.keys(MARITAL_STATUS_LABELS) as MaritalStatus[]
).map((k) => ({ value: k, label: MARITAL_STATUS_LABELS[k] }));

// ============================================================================
// SALARY TYPE
// ============================================================================

export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  monthly: "Mensual",
  biweekly: "Quincenal",
  weekly: "Semanal",
  daily: "Diario",
};

export const SALARY_TYPE_OPTIONS = (
  Object.keys(SALARY_TYPE_LABELS) as SalaryType[]
).map((k) => ({ value: k, label: SALARY_TYPE_LABELS[k] }));

// ============================================================================
// PAYMENT METHOD
// ============================================================================

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Transferencia bancaria",
  check: "Cheque",
  cash: "Efectivo",
};

export const PAYMENT_METHOD_OPTIONS = (
  Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]
).map((k) => ({ value: k, label: PAYMENT_METHOD_LABELS[k] }));

// ============================================================================
// BLOOD TYPE
// ============================================================================

export const BLOOD_TYPE_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
].map((v) => ({ value: v, label: v }));

// ============================================================================
// FILTERS
// ============================================================================

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todos los estados" },
  ...(Object.keys(EMPLOYEE_STATUS_LABELS) as EmployeeStatus[]).map((k) => ({
    value: k,
    label: EMPLOYEE_STATUS_LABELS[k],
  })),
];

export const EMPLOYMENT_TYPE_FILTER_OPTIONS = [
  { value: "", label: "Todos los tipos" },
  ...EMPLOYMENT_TYPE_OPTIONS,
];

export const ACTIVE_FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "true", label: "Activos" },
  { value: "false", label: "Inactivos" },
];

export const DEFAULT_PAGE_SIZE = 10;
