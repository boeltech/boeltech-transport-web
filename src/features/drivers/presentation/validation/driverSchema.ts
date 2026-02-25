/**
 * Driver Form Validation Schema
 * Clean Architecture - Presentation Layer (Validation)
 *
 * Esquema de validación Zod para formularios de conductor.
 *
 * Ubicación: src/features/drivers/presentation/validation/driverSchema.ts
 */

import { z } from "zod";
import { LicenseType, type LicenseTypeValue } from "../../domain";

// ============================================================================
// SCHEMA
// ============================================================================

export const driverSchema = z.object({
  // Empleado
  employeeId: z
    .string({ required_error: "Debe seleccionar un empleado" })
    .uuid("ID de empleado inválido"),

  // Licencia
  licenseNumber: z
    .string({ required_error: "El número de licencia es requerido" })
    .min(5, "El número de licencia debe tener al menos 5 caracteres")
    .max(20, "El número de licencia no puede exceder 20 caracteres")
    .regex(
      /^[A-Z0-9-]+$/i,
      "El número de licencia solo puede contener letras, números y guiones",
    ),

  licenseType: z.enum(
    [
      LicenseType.A,
      LicenseType.B,
      LicenseType.C,
      LicenseType.D,
      LicenseType.E,
      LicenseType.F,
    ] as [LicenseTypeValue, ...LicenseTypeValue[]],
    { required_error: "Debe seleccionar un tipo de licencia" },
  ),

  licenseExpiration: z
    .string({ required_error: "La fecha de vencimiento es requerida" })
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Fecha de vencimiento inválida" },
    ),

  licenseIssuedDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Fecha de emisión inválida" },
    ),

  licenseIssuingState: z
    .string()
    .max(50, "El estado emisor no puede exceder 50 caracteres")
    .optional(),

  // Experiencia
  yearsOfExperience: z
    .number({ invalid_type_error: "Debe ser un número" })
    .int("Debe ser un número entero")
    .min(0, "Los años de experiencia no pueden ser negativos")
    .max(60, "Los años de experiencia no pueden exceder 60")
    .optional(),

  // Información médica
  bloodType: z
    .string()
    .max(10, "El tipo de sangre no puede exceder 10 caracteres")
    .optional(),

  medicalCertificateExpiration: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: "Fecha de certificado médico inválida" },
    ),

  // Notas
  notes: z
    .string()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .optional(),

  // Contacto de emergencia
  emergencyContactName: z
    .string()
    .max(100, "El nombre del contacto no puede exceder 100 caracteres")
    .optional(),

  emergencyContactPhone: z
    .string()
    .max(20, "El teléfono del contacto no puede exceder 20 caracteres")
    .regex(/^[0-9+\-\s()]*$/, "Formato de teléfono inválido")
    .optional()
    .or(z.literal("")),

  emergencyContactRelationship: z
    .string()
    .max(50, "El parentesco no puede exceder 50 caracteres")
    .optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type DriverFormData = z.infer<typeof driverSchema>;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const defaultDriverFormValues: Partial<DriverFormData> = {
  employeeId: "",
  licenseNumber: "",
  licenseType: LicenseType.E,
  licenseExpiration: "",
  licenseIssuedDate: "",
  licenseIssuingState: "",
  yearsOfExperience: 0,
  bloodType: "",
  medicalCertificateExpiration: "",
  notes: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelationship: "",
};

// ============================================================================
// BLOOD TYPE OPTIONS
// ============================================================================

export const BLOOD_TYPE_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

// ============================================================================
// RELATIONSHIP OPTIONS
// ============================================================================

export const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Cónyuge" },
  { value: "parent", label: "Padre/Madre" },
  { value: "child", label: "Hijo/a" },
  { value: "sibling", label: "Hermano/a" },
  { value: "relative", label: "Otro familiar" },
  { value: "friend", label: "Amigo/a" },
  { value: "other", label: "Otro" },
];

// ============================================================================
// MEXICAN STATES OPTIONS
// ============================================================================

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
];
