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
  type Driver,
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

const psychometricResultEnum = z.enum(
  [
    PSYCHOMETRIC_RESULTS[0].value,
    PSYCHOMETRIC_RESULTS[1].value,
    PSYCHOMETRIC_RESULTS[2].value,
    PSYCHOMETRIC_RESULTS[3].value,
  ],
  { message: "Selecciona un resultado psicométrico válido" },
);

const drugTestResultEnum = z.enum(
  [
    DRUG_TEST_RESULTS[0].value,
    DRUG_TEST_RESULTS[1].value,
    DRUG_TEST_RESULTS[2].value,
  ],
  { message: "Selecciona un resultado de antidoping válido" },
);

/** Vacío = sin resultado (Select `__none__`). */
const optionalExamResult = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([schema, z.literal("")]).optional();

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

  // Licencia federal SICT (opcional como grupo)
  federalLicenseNumber: z
    .string()
    .max(30, "El número de licencia federal es muy largo")
    .optional(),

  federalLicenseCategory: z
    .enum(["A", "B", "C", "D", "E", "F"], {
      message: "Selecciona una categoría SICT válida",
    })
    .optional(),

  federalLicenseExpiry: z.string().optional(),

  // Licencia estatal (opcional)
  stateLicenseNumber: z
    .string()
    .max(30, "El número de licencia estatal es muy largo")
    .optional(),

  stateLicenseExpiry: z.string().optional(),

  stateIssuingState: z.string().optional(),

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

  psychometricTestResult: optionalExamResult(psychometricResultEnum),

  // ========================================
  // Examen Antidoping (OPCIONAL)
  // ========================================
  lastDrugTestDate: z.string().optional(),

  drugTestResult: optionalExamResult(drugTestResultEnum),

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
}).superRefine((data, ctx) => {
  const federalNumber = data.federalLicenseNumber?.trim();
  const federalCategory = data.federalLicenseCategory;
  const federalExpiry = data.federalLicenseExpiry?.trim();
  const federalAny = Boolean(federalNumber || federalCategory || federalExpiry);
  const federalComplete = Boolean(
    federalNumber && federalCategory && federalExpiry,
  );

  if (federalAny && !federalComplete) {
    const msg =
      "Completa número, categoría SICT y vencimiento de la licencia federal";
    if (!federalNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ["federalLicenseNumber"],
      });
    }
    if (!federalCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ["federalLicenseCategory"],
      });
    }
    if (!federalExpiry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ["federalLicenseExpiry"],
      });
    }
  }

  const stateNumber = data.stateLicenseNumber?.trim();
  const stateExpiry = data.stateLicenseExpiry?.trim();
  const stateIssuing = data.stateIssuingState?.trim();
  const stateAny = Boolean(stateNumber || stateExpiry || stateIssuing);
  const stateComplete = Boolean(stateNumber && stateExpiry && stateIssuing);

  if (stateAny && !stateComplete) {
    const msg =
      "Completa número, vencimiento y estado emisor de la licencia estatal";
    if (!stateNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ["stateLicenseNumber"],
      });
    }
    if (!stateExpiry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ["stateLicenseExpiry"],
      });
    }
    if (!stateIssuing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: msg,
        path: ["stateIssuingState"],
      });
    }
  }

  if (!federalComplete && !stateComplete) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Registra al menos una licencia: federal SICT o estatal",
      path: ["federalLicenseNumber"],
    });
  }
});

// ============================================================================
// Types
// ============================================================================

export type DriverFormData = z.infer<typeof driverSchema>;

/** Campos por paso del wizard de alta (0–2); el paso 3 es revisión. */
export const DRIVER_CREATE_WIZARD_STEP_FIELDS: (keyof DriverFormData)[][] = [
  ["employeeId"],
  [
    "federalLicenseNumber",
    "federalLicenseCategory",
    "federalLicenseExpiry",
    "stateLicenseNumber",
    "stateLicenseExpiry",
    "stateIssuingState",
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
  federalLicenseNumber: "",
  federalLicenseCategory: undefined,
  federalLicenseExpiry: "",
  stateLicenseNumber: "",
  stateLicenseExpiry: "",
  stateIssuingState: "",
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

function trimOrEmptyToNull(value: string | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

function trimOrEmptyToUndefined(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function mapLicenseFields(data: DriverFormData) {
  return {
    federalLicenseNumber: trimOrEmptyToNull(data.federalLicenseNumber),
    federalLicenseCategory: data.federalLicenseCategory ?? null,
    federalLicenseExpiry: trimOrEmptyToNull(data.federalLicenseExpiry),
    stateLicenseNumber: trimOrEmptyToNull(data.stateLicenseNumber),
    stateLicenseExpiry: trimOrEmptyToNull(data.stateLicenseExpiry),
    stateIssuingState: trimOrEmptyToNull(data.stateIssuingState),
  };
}

/**
 * Hidrata el formulario de edición desde el conductor cargado (una vez vía defaultValues).
 */
export function driverToFormValues(driver: Driver): DriverFormData {
  const normalizedFederalCategory = driver.federalLicenseCategory
    ? (driver.federalLicenseCategory.toUpperCase() as DriverFormData["federalLicenseCategory"])
    : undefined;

  const validPsychometricResults = PSYCHOMETRIC_RESULTS.map((r) => r.value);
  const psychometricValue = driver.psychometricTestResult ?? "";
  const normalizedPsychometricResult = validPsychometricResults.includes(
    psychometricValue as (typeof validPsychometricResults)[number],
  )
    ? psychometricValue
    : "";

  const validDrugTestResults = DRUG_TEST_RESULTS.map((r) => r.value);
  const drugTestValue = driver.drugTestResult ?? "";
  const normalizedDrugTestResult = validDrugTestResults.includes(
    drugTestValue as (typeof validDrugTestResults)[number],
  )
    ? drugTestValue
    : "";

  return {
    employeeId: driver.employeeId,
    federalLicenseNumber: driver.federalLicenseNumber || "",
    federalLicenseCategory: normalizedFederalCategory,
    federalLicenseExpiry: driver.federalLicenseExpiry || "",
    stateLicenseNumber: driver.stateLicenseNumber || "",
    stateLicenseExpiry: driver.stateLicenseExpiry || "",
    stateIssuingState: driver.stateIssuingState || "",
    medicalCertificateNumber: driver.medicalCertificateNumber || "",
    medicalCertificateExpiry: driver.medicalCertificateExpiry || "",
    medicalCertificateIssuer: driver.medicalCertificateIssuer || "",
    psychometricTestDate: driver.psychometricTestDate || "",
    psychometricTestResult: normalizedPsychometricResult || "",
    lastDrugTestDate: driver.lastDrugTestDate || "",
    drugTestResult: normalizedDrugTestResult || "",
    assignedDeviceId: driver.assignedDeviceId || "",
    notes: driver.notes || "",
  };
}

/**
 * Normaliza edición desde el formulario al DTO de actualización.
 * No incluye status/isActive (solo PATCH /drivers/:id/status).
 */
export function driverFormDataToUpdateDriverDTO(
  data: DriverFormData,
): UpdateDriverDTO {
  return {
    ...mapLicenseFields(data),
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
  };
}

export function driverFormDataToCreateDriverDTO(
  data: DriverFormData,
): CreateDriverDTO {
  return {
    employeeId: data.employeeId,
    ...mapLicenseFields(data),
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
