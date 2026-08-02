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
import {
  LicenseType,
  LICENSE_TYPE_LABELS,
  type CreateDriverDTO,
  type DriverStatusType,
  type LicenseTypeValue,
  type UpdateDriverDTO,
} from "../../domain";

// ============================================================================
// Constants
// ============================================================================

/** Misma fuente que el detalle (`LICENSE_TYPE_LABELS` del domain). */
export const LICENSE_TYPES = (
  Object.values(LicenseType) as LicenseTypeValue[]
).map((value) => ({
  value,
  label: LICENSE_TYPE_LABELS[value],
}));

export const MEXICAN_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  // "Ciudad de México",
  "CDMX",
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
    message: "El tipo de licencia es requerido",
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

/** Campos por paso del wizard de alta (0–2); el paso 3 es revisión. */
export const DRIVER_CREATE_WIZARD_STEP_FIELDS: (keyof DriverFormData)[][] = [
  ["employeeId"],
  [
    "licenseNumber",
    "licenseType",
    "licenseExpiry",
    "licenseState",
    "medicalCertificateNumber",
    "medicalCertificateExpiry",
    "medicalCertificateIssuer",
  ],
  [
    "psychometricTestDate",
    "psychometricTestResult",
    "lastDrugTestDate",
    "drugTestResult",
    "assignedDeviceId",
    "notes",
  ],
];

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
// Mapper: Form → CreateDriverDTO (dominio / API vía toApiCreateDriver)
// ============================================================================

function trimOrEmptyToUndefined(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

/**
 * Normaliza el alta desde el formulario al DTO de creación.
 * Evita enviar `""` en fechas u opcionales (el backend valida YYYY-MM-DD estricto).
 */
/**
 * Normaliza edición desde el formulario al DTO de actualización (incluye status/isActive).
 */
export function driverFormDataToUpdateDriverDTO(
  data: DriverFormData,
  base: { status: DriverStatusType; isActive: boolean },
): UpdateDriverDTO {
  return {
    licenseNumber: data.licenseNumber.trim(),
    licenseType: data.licenseType,
    licenseExpiry: data.licenseExpiry,
    licenseIssuingState: trimOrEmptyToUndefined(data.licenseState) ?? null,
    medicalCertificateNumber:
      trimOrEmptyToUndefined(data.medicalCertificateNumber) ?? null,
    medicalCertificateExpiry:
      trimOrEmptyToUndefined(data.medicalCertificateExpiry) ?? null,
    medicalCertificateIssuer:
      trimOrEmptyToUndefined(data.medicalCertificateIssuer) ?? null,
    psychometricTestDate:
      trimOrEmptyToUndefined(data.psychometricTestDate) ?? null,
    psychometricTestResult:
      trimOrEmptyToUndefined(data.psychometricTestResult) ?? null,
    lastDrugTestDate: trimOrEmptyToUndefined(data.lastDrugTestDate) ?? null,
    drugTestResult: trimOrEmptyToUndefined(data.drugTestResult) ?? null,
    assignedDeviceId: trimOrEmptyToUndefined(data.assignedDeviceId) ?? null,
    notes: trimOrEmptyToUndefined(data.notes) ?? null,
    status: base.status,
    isActive: base.isActive,
  };
}

export function driverFormDataToCreateDriverDTO(
  data: DriverFormData,
): CreateDriverDTO {
  return {
    employeeId: data.employeeId,
    licenseNumber: data.licenseNumber.trim(),
    licenseType: data.licenseType,
    licenseExpiry: data.licenseExpiry,
    licenseIssuingState: trimOrEmptyToUndefined(data.licenseState),
    medicalCertificateNumber: trimOrEmptyToUndefined(
      data.medicalCertificateNumber,
    ),
    medicalCertificateExpiry: trimOrEmptyToUndefined(
      data.medicalCertificateExpiry,
    ),
    medicalCertificateIssuer: trimOrEmptyToUndefined(
      data.medicalCertificateIssuer,
    ),
    psychometricTestDate: trimOrEmptyToUndefined(data.psychometricTestDate),
    psychometricTestResult: trimOrEmptyToUndefined(
      data.psychometricTestResult,
    ),
    lastDrugTestDate: trimOrEmptyToUndefined(data.lastDrugTestDate),
    drugTestResult: trimOrEmptyToUndefined(data.drugTestResult),
    assignedDeviceId: trimOrEmptyToUndefined(data.assignedDeviceId),
    notes: trimOrEmptyToUndefined(data.notes),
  };
}
