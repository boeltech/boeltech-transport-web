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
import { addressSchema } from "@shared/validation/addressSchema";

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
const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const digits11Regex = /^\d{11}$/;
const digits18Regex = /^\d{18}$/;

const employeeDomicilioSchema = addressSchema.safeExtend({
  addressType: z.literal("personal"),
  isPrimary: z.literal(true),
  /** API puede usar UUID u otro identificador */
  id: z.string().optional(),
});

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
    .regex(curpRegex, "La CURP no tiene un formato válido")
    .optional()
    .or(z.literal("")),

  rfc: z
    .string()
    .min(12, "El RFC debe tener al menos 12 caracteres")
    .max(13, "El RFC debe tener máximo 13 caracteres")
    .regex(rfcRegex, "El RFC no tiene un formato válido")
    .optional()
    .or(z.literal("")),

  nss: z
    .string()
    .length(11, "El NSS debe tener exactamente 11 dígitos")
    .regex(digits11Regex, "El NSS solo debe contener dígitos")
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
  // Domicilio (SAT + calle, recurso addresses)
  // ========================================
  domicilio: employeeDomicilioSchema,

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

  // Phase 1 catalog rollout:
  // keep as free string for backward compatibility with legacy records.
  // In phase 2 these can be upgraded to tenant-backed catalog validation.
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
    .regex(digits18Regex, "La CLABE solo debe contener dígitos")
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

export const defaultEmployeeDomicilio: EmployeeFormData["domicilio"] = {
  addressType: "personal",
  isPrimary: true,
  street: "",
  exteriorNumber: "",
  interiorNumber: null,
  reference: null,
  postalCode: "",
  satCountryCode: "MEX",
  satStateCode: "",
  satMunicipalityCode: "",
  satLocalityCode: null,
  satNeighborhoodCode: null,
  neighborhoodName: null,
  latitude: null,
  longitude: null,
};

export const defaultEmployeeFormValues: EmployeeFormData = {
  first_name: "",
  last_name: "",
  second_last_name: "",
  birth_date: "",
  // Campos opcionales declarados explícitamente para que RHF los conozca
  // desde el primer render. En selects opcionales usamos `undefined`
  // (no string vacío) para evitar value inválido en Radix Select.
  gender: undefined,
  marital_status: undefined,
  blood_type: undefined,
  nationality: "",
  birth_place: "",
  curp: "",
  rfc: "",
  nss: "",
  infonavit_number: "",
  email: "",
  phone: "",
  mobile_phone: "",
  domicilio: defaultEmployeeDomicilio,
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relationship: undefined,
  hire_date: "",
  employment_type: "permanent",
  department: undefined,
  position: undefined,
  job_title: "",
  work_location: undefined,
  base_salary: undefined,
  salary_type: undefined,
  payment_method: undefined,
  bank_name: "",
  bank_account_number: "",
  bank_clabe: "",
  medical_notes: "",
  notes: "",
};
