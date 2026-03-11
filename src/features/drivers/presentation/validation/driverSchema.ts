/**
 * Driver Form Schema
 * Clean Architecture - Presentation Layer (Validation)
 *
 * Schema de validación Zod para el formulario de conductores.
 *
 * IMPORTANTE: Los datos personales del conductor están en el módulo employees.
 * Este formulario solo captura los datos específicos de conductor:
 * - Referencia al empleado (employee_id)
 * - Datos de licencia
 * - Certificado médico
 * - Exámenes (psicométrico y antidoping)
 * - Dispositivo asignado
 */

import { z } from "zod";

// ============================================================================
// Constants
// ============================================================================

export const LICENSE_TYPES = [
  { value: "A", label: "Tipo A - Motocicletas" },
  { value: "B", label: "Tipo B - Automóviles particulares" },
  { value: "C", label: "Tipo C - Taxis y transporte público" },
  { value: "D", label: "Tipo D - Autobuses" },
  { value: "E", label: "Tipo E - Carga (Federal)" },
  { value: "F", label: "Tipo F - Transporte escolar" },
] as const;

export const MEXICAN_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;

export const PSYCHOMETRIC_RESULTS = [
  { value: "approved", label: "Aprobado" },
  { value: "conditionally_approved", label: "Aprobado con observaciones" },
  { value: "not_approved", label: "No aprobado" },
  { value: "pending", label: "Pendiente" },
] as const;

export const DRUG_TEST_RESULTS = [
  { value: "negative", label: "Negativo" },
  { value: "positive", label: "Positivo" },
  { value: "pending", label: "Pendiente" },
] as const;

// ============================================================================
// Schema
// ============================================================================

export const driverSchema = z.object({
  // ========================================
  // Referencia al Empleado (REQUERIDO)
  // ========================================
  employeeId: z
    .string()
    .uuid("Debe seleccionar un empleado válido")
    .min(1, "Debe seleccionar un empleado"),

  // ========================================
  // Datos de Licencia (REQUERIDO)
  // ========================================
  licenseNumber: z
    .string()
    .min(1, "El número de licencia es requerido")
    .max(30, "El número de licencia es muy largo"),

  licenseType: z.enum(["A", "B", "C", "D", "E", "F"], {
    required_error: "El tipo de licencia es requerido",
  }),

  licenseExpiry: z.string().min(1, "La fecha de vencimiento es requerida"),

  licenseState: z.string().optional(),

  // ========================================
  // Certificado Médico (OPCIONAL)
  // ========================================
  medicalCertificateNumber: z
    .string()
    .max(50, "El número de certificado es muy largo")
    .optional(),

  medicalCertificateExpiry: z.string().optional(),

  medicalCertificateIssuer: z
    .string()
    .max(100, "El nombre del emisor es muy largo")
    .optional(),

  // ========================================
  // Examen Psicométrico (OPCIONAL)
  // ========================================
  psychometricTestDate: z.string().optional(),

  psychometricTestResult: z
    .string()
    .max(50, "El resultado es muy largo")
    .optional(),

  // ========================================
  // Examen Antidoping (OPCIONAL)
  // ========================================
  lastDrugTestDate: z.string().optional(),

  drugTestResult: z.string().max(20, "El resultado es muy largo").optional(),

  // ========================================
  // Dispositivo Asignado (OPCIONAL)
  // ========================================
  assignedDeviceId: z
    .string()
    .max(50, "El ID del dispositivo es muy largo")
    .optional(),

  // ========================================
  // Notas (OPCIONAL)
  // ========================================
  notes: z.string().max(1000, "Las notas son muy largas").optional(),
});

// ============================================================================
// Types
// ============================================================================

export type DriverFormData = z.infer<typeof driverSchema>;

// ============================================================================
// Default Values
// ============================================================================

export const defaultDriverFormValues: DriverFormData = {
  employeeId: "",
  licenseNumber: "",
  licenseType: "E",
  licenseExpiry: "",
  licenseState: "",
  medicalCertificateNumber: "",
  medicalCertificateExpiry: "",
  medicalCertificateIssuer: "",
  psychometricTestDate: "",
  psychometricTestResult: "",
  lastDrugTestDate: "",
  drugTestResult: "",
  assignedDeviceId: "",
  notes: "",
};

// ============================================================================
// Mapper: Form Data → API Request (snake_case)
// ============================================================================

/**
 * Convierte los datos del formulario al formato que espera el backend.
 * Transforma camelCase → snake_case
 * Solo incluye campos con valor (no envía strings vacíos)
 */
// export function toApiCreateDriver(data: DriverFormData) {
//   return {
//     employee_id: data.employeeId,
//     license_number: data.licenseNumber,
//     license_type: data.licenseType,
//     license_expiry: data.licenseExpiry,
//     license_state: data.licenseState || undefined,
//     medical_certificate_number: data.medicalCertificateNumber || undefined,
//     medical_certificate_expiry: data.medicalCertificateExpiry || undefined,
//     medical_certificate_issuer: data.medicalCertificateIssuer || undefined,
//     psychometric_test_date: data.psychometricTestDate || undefined,
//     psychometric_test_result: data.psychometricTestResult || undefined,
//     last_drug_test_date: data.lastDrugTestDate || undefined,
//     drug_test_result: data.drugTestResult || undefined,
//     assigned_device_id: data.assignedDeviceId || undefined,
//     notes: data.notes || undefined,
//   };
// }
