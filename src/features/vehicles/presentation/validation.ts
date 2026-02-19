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
// Create Vehicle Schema
// ============================================

export const createVehicleSchema = z.object({
  // Identification
  unitNumber: z
    .string()
    .min(1, "El número de unidad es requerido")
    .max(20, "Máximo 20 caracteres"),
  licensePlate: z
    .string()
    .min(1, "La placa es requerida")
    .max(15, "Máximo 15 caracteres"),
  vin: z.string().max(50, "Máximo 50 caracteres").optional().or(z.literal("")),

  // Characteristics
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
  loadCapacity: z
    .number()
    .positive("Debe ser mayor a 0")
    .optional()
    .or(z.literal(undefined)),
  volumeCapacity: z
    .number()
    .positive("Debe ser mayor a 0")
    .optional()
    .or(z.literal(undefined)),
  fuelTankCapacity: z
    .number()
    .positive("Debe ser mayor a 0")
    .optional()
    .or(z.literal(undefined)),
  expectedFuelEfficiency: z
    .number()
    .positive("Debe ser mayor a 0")
    .optional()
    .or(z.literal(undefined)),

  // Mileage
  currentMileage: z
    .number()
    .int()
    .nonnegative("No puede ser negativo")
    .default(0),

  // Documentation
  insurancePolicy: z.string().max(50).optional().or(z.literal("")),
  insuranceExpiry: z.string().optional().or(z.literal("")),
  sctPermitNumber: z.string().max(50).optional().or(z.literal("")),
  sctPermitExpiry: z.string().optional().or(z.literal("")),
});

// ============================================
// Update Vehicle Schema
// ============================================

export const updateVehicleSchema = z.object({
  licensePlate: z.string().min(1).max(15).optional(),
  vin: z.string().max(50).nullable().optional(),
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
  loadCapacity: z.number().positive().nullable().optional(),
  volumeCapacity: z.number().positive().nullable().optional(),
  fuelTankCapacity: z.number().positive().nullable().optional(),
  expectedFuelEfficiency: z.number().positive().nullable().optional(),
  currentMileage: z.number().int().nonnegative().optional(),
  insurancePolicy: z.string().max(50).nullable().optional(),
  insuranceExpiry: z.string().nullable().optional(),
  sctPermitNumber: z.string().max(50).nullable().optional(),
  sctPermitExpiry: z.string().nullable().optional(),
  status: vehicleStatusSchema.optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Type Exports
// ============================================

export type CreateVehicleFormData = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;
