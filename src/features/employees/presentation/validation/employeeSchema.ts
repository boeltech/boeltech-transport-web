/**
 * Employee Form Schema
 * Clean Architecture - Presentation Layer (Validation)
 *
 * Schema de validación Zod para el formulario de empleados.
 *
 * Cubre todos los datos del empleado:
 * - Datos personales (nombre, nacimiento, género)
 * - IDs fiscales/gobierno (CURP, RFC, NSS)
 * - Contacto (email, teléfonos, domicilio)
 * - Información laboral (fecha ingreso, tipo contrato, puesto)
 * - Compensación (salario, método pago, datos bancarios)
 */

import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

export const GENDER_VALUES = ["M", "F"] as const;

export const MARITAL_STATUS_VALUES = [
  "single",
  "married",
  "divorced",
  "widowed",
  "cohabiting",
] as const;

export const EMPLOYMENT_TYPE_VALUES = [
  "permanent",
  "temporary",
  "contractor",
] as const;

export const SALARY_TYPE_VALUES = [
  "monthly",
  "biweekly",
  "weekly",
  "daily",
] as const;

export const PAYMENT_METHOD_VALUES = [
  "bank_transfer",
  "check",
  "cash",
] as const;

export const BLOOD_TYPE_VALUES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

// ============================================================================
// Schema
// ============================================================================

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const employeeSchema = z.object({
  // ========================================
  // Datos personales (REQUERIDO)
  // ========================================
  first_name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre es muy largo"),

  last_name: z
    .string()
    .min(1, "El apellido paterno es requerido")
    .max(100, "El apellido es muy largo"),

  second_last_name: z
    .string()
    .max(100, "El apellido materno es muy largo")
    .optional(),

  birth_date: z
    .string()
    .regex(dateRegex, "Formato YYYY-MM-DD requerido")
    .optional()
    .or(z.literal("")),

  gender: z.enum(GENDER_VALUES).optional(),

  marital_status: z.enum(MARITAL_STATUS_VALUES).optional(),

  nationality: z.string().max(50, "La nacionalidad es muy larga").optional(),

  birth_place: z
    .string()
    .max(100, "El lugar de nacimiento es muy largo")
    .optional(),

  blood_type: z.string().optional(),

  // ========================================
  // IDs fiscales / gobierno (OPCIONAL)
  // ========================================
  curp: z
    .string()
    .length(18, "La CURP debe tener exactamente 18 caracteres")
    .optional()
    .or(z.literal("")),

  rfc: z
    .string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC debe tener máximo 13 caracteres")
    .optional()
    .or(z.literal("")),

  nss: z
    .string()
    .length(11, "El NSS debe tener exactamente 11 dígitos")
    .optional()
    .or(z.literal("")),

  infonavit_number: z
    .string()
    .max(20, "El número Infonavit es muy largo")
    .optional(),

  // ========================================
  // Contacto (OPCIONAL)
  // ========================================
  email: z
    .string()
    .email("El correo electrónico no es válido")
    .optional()
    .or(z.literal("")),

  phone: z.string().max(20, "El teléfono es muy largo").optional(),

  mobile_phone: z.string().max(20, "El celular es muy largo").optional(),

  // ========================================
  // Domicilio (OPCIONAL)
  // ========================================
  street: z.string().max(200, "La calle es muy larga").optional(),

  exterior_number: z
    .string()
    .max(20, "El número exterior es muy largo")
    .optional(),

  interior_number: z
    .string()
    .max(20, "El número interior es muy largo")
    .optional(),

  neighborhood: z.string().max(100, "La colonia es muy larga").optional(),

  city: z.string().max(100, "La ciudad es muy larga").optional(),

  state: z.string().max(50, "El estado es muy largo").optional(),

  postal_code: z.string().max(10, "El código postal es muy largo").optional(),

  country: z.string().max(50, "El país es muy largo").optional(),

  // ========================================
  // Contacto de emergencia (OPCIONAL)
  // ========================================
  emergency_contact_name: z
    .string()
    .max(200, "El nombre del contacto es muy largo")
    .optional(),

  emergency_contact_phone: z
    .string()
    .max(20, "El teléfono de emergencia es muy largo")
    .optional(),

  emergency_contact_relationship: z
    .string()
    .max(50, "El parentesco es muy largo")
    .optional(),

  // ========================================
  // Información laboral (REQUERIDO)
  // ========================================
  hire_date: z
    .string()
    .min(1, "La fecha de ingreso es requerida")
    .regex(dateRegex, "Formato YYYY-MM-DD requerido"),

  employment_type: z.enum(EMPLOYMENT_TYPE_VALUES),

  department: z.string().max(100, "El departamento es muy largo").optional(),

  position: z.string().max(100, "El puesto es muy largo").optional(),

  job_title: z.string().max(100, "El título del trabajo es muy largo").optional(),

  work_location: z.string().max(100, "La ubicación es muy larga").optional(),

  // ========================================
  // Compensación (OPCIONAL)
  // ========================================
  base_salary: z
    .number()
    .positive("El salario debe ser mayor a cero")
    .optional(),

  salary_type: z.enum(SALARY_TYPE_VALUES).optional(),

  payment_method: z.enum(PAYMENT_METHOD_VALUES).optional(),

  // ========================================
  // Datos bancarios (OPCIONAL)
  // ========================================
  bank_name: z.string().max(100, "El nombre del banco es muy largo").optional(),

  bank_account_number: z
    .string()
    .max(20, "El número de cuenta es muy largo")
    .optional(),

  bank_clabe: z
    .string()
    .length(18, "La CLABE debe tener exactamente 18 dígitos")
    .optional()
    .or(z.literal("")),

  // ========================================
  // Notas (OPCIONAL)
  // ========================================
  medical_notes: z
    .string()
    .max(2000, "Las notas médicas son muy largas")
    .optional(),

  notes: z.string().max(2000, "Las notas son muy largas").optional(),
});

// ============================================================================
// Types
// ============================================================================

export type EmployeeFormData = z.infer<typeof employeeSchema>;

// ============================================================================
// Default Values
// ============================================================================

export const defaultEmployeeFormValues: EmployeeFormData = {
  first_name: "",
  last_name: "",
  second_last_name: "",
  birth_date: "",
  nationality: "",
  birth_place: "",
  curp: "",
  rfc: "",
  nss: "",
  infonavit_number: "",
  email: "",
  phone: "",
  mobile_phone: "",
  street: "",
  exterior_number: "",
  interior_number: "",
  neighborhood: "",
  city: "",
  state: "",
  postal_code: "",
  country: "México",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: "",
  hire_date: "",
  employment_type: "permanent",
  department: "",
  position: "",
  job_title: "",
  work_location: "",
  bank_name: "",
  bank_account_number: "",
  bank_clabe: "",
  medical_notes: "",
  notes: "",
};
