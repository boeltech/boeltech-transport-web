/**
 * Vehicle Validation Schemas
 * Clean Architecture - Presentation Layer
 *
 * Schemas Zod para validación de formularios de vehículos.
 *
 * ACTUALIZADO: Incluye campos de Carta Porte 3.1
 *
 * Ubicación: src/features/vehicles/presentation/validation.ts
 */

import { z } from "zod";

// ============================================
// Enums (mirror backend)
// ============================================

const vehicleTypeSchema = z.enum([
  "truck",
  "torton",
  "rabon",
  "pickup",
  "utility",
]);

const vehicleStatusSchema = z.enum([
  "available",
  "on_trip",
  "in_maintenance",
  "out_of_service",
]);

// ============================================
// Helper: Optional positive number (handles string from HTML input)
// ============================================

/**
 * Schema para números opcionales positivos.
 * - Acepta: number | string (de HTML input) | null | undefined
 * - Convierte strings vacíos y null a undefined
 * - Valida que sea positivo si tiene valor
 * - Retorna: number | undefined
 */
const optionalPositiveNumber = z.preprocess(
  (val) => {
    // // null o undefined → undefined
    // if (val === null || val === undefined) return undefined;
    // // string vacío → undefined
    // if (val === "") return undefined;

    // string numérico o número → número
    const parsed = typeof val === "string" ? parseFloat(val) : val;
    // NaN → undefined
    // if (typeof parsed === "number" && isNaN(parsed)) return undefined;
    return parsed;
  },
  z.number().positive("Debe ser mayor a 0").optional().or(z.literal(undefined)),
);

// ============================================
// Create Vehicle Schema
// ============================================

export const createVehicleSchema = z.object({
  // ── Identification ────────────────────────────────────────────────────────
  unitNumber: z
    .string()
    .min(1, "El número de unidad es requerido")
    .max(20, "Máximo 20 caracteres"),
  licensePlate: z
    .string()
    .min(1, "La placa es requerida")
    .max(15, "Máximo 15 caracteres"),
  vin: z.string().max(50, "Máximo 50 caracteres").optional().or(z.literal("")),

  // ── Characteristics ───────────────────────────────────────────────────────
  brand: z
    .string()
    .min(1, "La marca es requerida")
    .max(50, "Máximo 50 caracteres"),
  model: z
    .string()
    .min(1, "El modelo es requerido")
    .max(50, "Máximo 50 caracteres"),
  year: z
    .number({
      error: "El año es requerido",
    })
    .int("Debe ser un número entero")
    .min(1900, "Año inválido")
    .max(new Date().getFullYear() + 1, "Año inválido"),
  type: vehicleTypeSchema.default("truck"),
  color: z.string().max(30).optional().or(z.literal("")),

  // Capacities
  loadCapacity: optionalPositiveNumber,
  volumeCapacity: optionalPositiveNumber,
  fuelTankCapacity: optionalPositiveNumber,
  expectedFuelEfficiency: optionalPositiveNumber,

  // Mileage
  currentMileage: z
    .number({ required_error: "El kilometraje actual es requerido" })
    .int("Debe ser un número entero")
    .nonnegative("No puede ser negativo"),

  // ── Documentation ─────────────────────────────────────────────────────────
  insurancePolicy: z.string().max(50).optional().or(z.literal("")),
  insuranceExpiry: z.string().optional().or(z.literal("")),
  sctPermitNumber: z.string().max(50).optional().or(z.literal("")),
  sctPermitExpiry: z.string().optional().or(z.literal("")),

  // ── Carta Porte 3.1 ───────────────────────────────────────────────────────
  satTipoPermisoCode: z
    .string()
    .max(10, "Máximo 10 caracteres")
    .optional()
    .or(z.literal("")),
  satConfigAutotransporteCode: z
    .string()
    .max(10, "Máximo 10 caracteres")
    .optional()
    .or(z.literal("")),
  insuranceCompany: z
    .string()
    .max(100, "Máximo 100 caracteres")
    .optional()
    .or(z.literal("")),
});

// ============================================
// Update Vehicle Schema
// ============================================

export const updateVehicleSchema = z.object({
  // Identification (unitNumber no se puede cambiar)
  licensePlate: z.string().min(1).max(15).optional(),
  vin: z.string().max(50).nullable().optional(),

  // Characteristics
  brand: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(50).optional(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  type: vehicleTypeSchema.optional(),
  color: z.string().max(30).nullable().optional(),

  // Capacities
  loadCapacity: z.number().positive().nullable().optional(),
  volumeCapacity: z.number().positive().nullable().optional(),
  fuelTankCapacity: z.number().positive().nullable().optional(),
  expectedFuelEfficiency: z.number().positive().nullable().optional(),

  // Mileage
  currentMileage: z
    .number({ required_error: "El kilometraje actual es requerido" })
    .int("Debe ser un número entero")
    .nonnegative("No puede ser negativo"),

  // Documentation
  insurancePolicy: z.string().max(50).nullable().optional(),
  insuranceExpiry: z.string().nullable().optional(),
  sctPermitNumber: z.string().max(50).nullable().optional(),
  sctPermitExpiry: z.string().nullable().optional(),

  // Carta Porte 3.1
  satTipoPermisoCode: z.string().max(10).nullable().optional(),
  satConfigAutotransporteCode: z.string().max(10).nullable().optional(),
  insuranceCompany: z.string().max(100).nullable().optional(),

  // Status
  status: vehicleStatusSchema.optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Type Exports
// ============================================

export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;
