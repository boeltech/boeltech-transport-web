/**
 * Vehicle Validation Schemas
 * Clean Architecture - Presentation Layer
 *
 * Schemas Zod para validación de formularios de vehículos.
 *
 * Carta Porte 3.1 (SoT `@boeltech/cfdi-domain/validateVehicleForCartaPorteStamp`):
 * - Alta: los campos del nodo `Autotransporte` (PermSCT, NumPermisoSCT,
 *   ConfigVehicular, PesoBrutoVehicular, AseguraRespCivil, PolizaRespCivil)
 *   son **requeridos** para garantizar que cualquier vehículo nuevo sea
 *   timbrable. PlacaVM/AnioModeloVM ya son requeridos como datos básicos.
 * - Edición: los CP3.1 quedan opcionales para no bloquear ediciones puntuales
 *   sobre vehículos legacy sin estos datos (el pre-stamp API bloquea timbrado).
 * - Remolques: si `ConfigVehicular` exige remolques (catálogos `S\d`/`R\d`,
 *   regla del paquete `configVehicularLikelyRequiresRemolques`), se exige al
 *   menos uno.
 *
 * Ubicación: src/features/vehicles/presentation/validation.ts
 */

import { z } from "zod";
import { configVehicularLikelyRequiresRemolques } from "@boeltech/cfdi-domain";

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

const remolqueSchema = z.object({
  satSubTipoRemCode: z
    .string()
    .min(1, "Selecciona el subtipo de remolque")
    .max(10, "Máximo 10 caracteres"),
  licensePlate: z
    .string()
    .regex(
      /^[A-Za-z0-9]{5,7}$/,
      "La placa del remolque debe tener 5 a 7 caracteres alfanuméricos",
    ),
});

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
/** Entrada desde input numérico: vacío/null/NaN → undefined (no capturado). */
function preprocessVehicleCurrentMileage(val: unknown): unknown {
  if (val === "" || val === undefined || val === null) return undefined;
  if (typeof val === "number") {
    if (Number.isNaN(val)) return undefined;
    return val;
  }
  if (typeof val === "string") {
    const t = val.trim();
    if (t === "") return undefined;
    const parsed = Number(t);
    if (Number.isNaN(parsed)) return val;
    return parsed;
  }
  return val;
}

/** Kilometraje: opcional en formulario · si viene valor debe ser entero ≥ 0. */
const vehicleFormCurrentMileageSchema = z.preprocess(
  preprocessVehicleCurrentMileage,
  z
    .number()
    .int("Debe ser un número entero")
    .nonnegative("No puede ser negativo")
    .optional(),
);

/**
 * Peso bruto vehicular (ton) desde API o input: acepta number o string numérico.
 * `Number("10.200")` es NaN en JS; `parseFloat("10.200")` → 10.2.
 */
export function parsePesoBrutoVehicularFormInput(
  val: unknown,
): number | undefined {
  if (val === "" || val === undefined || val === null) return undefined;
  if (typeof val === "number") {
    if (Number.isNaN(val)) return undefined;
    return val;
  }
  if (typeof val === "string") {
    const t = val.trim().replace(/\s/g, "").replace(",", ".");
    if (t === "") return undefined;
    const parsed = parseFloat(t);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function preprocessPesoBrutoVehicular(val: unknown): unknown {
  const n = parsePesoBrutoVehicularFormInput(val);
  if (n !== undefined) return n;
  if (val === "" || val === undefined || val === null) return undefined;
  if (typeof val === "string" && val.trim() !== "") return val;
  return undefined;
}

/** Peso bruto vehicular — versión opcional (modo edición/legacy). */
const vehicleFormPesoBrutoSchema = z.preprocess(
  preprocessPesoBrutoVehicular,
  z
    .number()
    .positive("Debe ser mayor a 0")
    .max(9999.999, "Máximo 9999.999 toneladas")
    .optional(),
);

/** Peso bruto vehicular — versión requerida (alta CP3.1). */
const vehicleFormPesoBrutoRequiredSchema = z.preprocess(
  preprocessPesoBrutoVehicular,
  z
    .number({ error: "El peso bruto vehicular es requerido para Carta Porte" })
    .positive("Debe ser mayor a 0")
    .max(9999.999, "Máximo 9999.999 toneladas"),
);

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
// Vehicle Form Schemas
// ============================================

/**
 * Campos comunes alta/edición (identidad, características, capacidades,
 * documentación, seguros opcionales y remolques).
 * Los campos CP3.1 críticos (PermSCT, NumPermisoSCT, ConfigVehicular,
 * PesoBruto, AseguraRespCivil, PolizaRespCivil) se definen por separado
 * para tener variantes requeridas (alta) y opcionales (edición).
 */
const vehicleFormCommonShape = {
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
  branchId: z.string().uuid().optional().or(z.literal("")),

  // Capacities
  loadCapacity: optionalPositiveNumber,
  volumeCapacity: optionalPositiveNumber,
  fuelTankCapacity: optionalPositiveNumber,
  expectedFuelEfficiency: optionalPositiveNumber,

  // Mileage (opcional en UI; POST normaliza falta como 0)
  currentMileage: vehicleFormCurrentMileageSchema,

  // ── Vigencias (operativas, no XSD) ────────────────────────────────────────
  insuranceExpiry: z.string().optional().or(z.literal("")),
  sctPermitExpiry: z.string().optional().or(z.literal("")),

  // ── Seguros adicionales (opcionales para CP3.1) ───────────────────────────
  aseguraMedioAmbiente: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .optional()
    .or(z.literal("")),
  polizaMedioAmbiente: z
    .string()
    .max(30, "Máximo 30 caracteres")
    .optional()
    .or(z.literal("")),
  aseguraCarga: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .optional()
    .or(z.literal("")),
  polizaCarga: z
    .string()
    .max(30, "Máximo 30 caracteres")
    .optional()
    .or(z.literal("")),

  // Remolques (cardinalidad CP3.1: máx. 2)
  remolques: z.array(remolqueSchema).max(2, "Máximo 2 remolques").default([]),
} as const;

/**
 * Refinement compartido: si la `ConfigVehicular` SAT requiere remolques
 * (patrones `S\d`/`R\d` según `configVehicularLikelyRequiresRemolques`),
 * se exige al menos uno.
 */
function applyRemolquesConditional(
  data: {
    satConfigAutotransporteCode?: string | null;
    remolques: Array<{ satSubTipoRemCode: string; licensePlate: string }>;
  },
  ctx: z.RefinementCtx,
) {
  const config = (data.satConfigAutotransporteCode ?? "").trim();
  if (!config) return;
  if (
    configVehicularLikelyRequiresRemolques(config) &&
    data.remolques.length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["remolques"],
      message:
        "La configuración vehicular SAT seleccionada requiere capturar al menos un remolque (SubTipoRem + Placa).",
    });
  }
}

// ============================================
// Create Vehicle Schema — CP3.1 estricto
// ============================================

/**
 * Schema de alta de vehículo. Los campos del nodo `Autotransporte` son
 * requeridos para que cualquier vehículo nuevo sea timbrable en CP3.1.
 */
export const createVehicleSchema = z
  .object({
    ...vehicleFormCommonShape,

    // ── Carta Porte 3.1 — Autotransporte (REQUERIDOS) ───────────────────────
    // PermSCT — catálogo SAT c_TipoPermiso
    satTipoPermisoCode: z
      .string()
      .min(1, "Selecciona el tipo de permiso SCT (PermSCT)")
      .max(10, "Máximo 10 caracteres"),
    // NumPermisoSCT
    sctPermitNumber: z
      .string()
      .min(1, "El número de permiso SCT es requerido para Carta Porte")
      .max(50, "Máximo 50 caracteres"),
    // ConfigVehicular — catálogo SAT c_ConfigAutotransporte
    satConfigAutotransporteCode: z
      .string()
      .min(1, "Selecciona la configuración vehicular SAT (ConfigVehicular)")
      .max(10, "Máximo 10 caracteres"),
    // PesoBrutoVehicular (toneladas)
    pesoBrutoVehicular: vehicleFormPesoBrutoRequiredSchema,
    // AseguraRespCivil
    insuranceCompany: z
      .string()
      .min(
        1,
        "La aseguradora de responsabilidad civil es requerida para Carta Porte",
      )
      .max(50, "Máximo 50 caracteres"),
    // PolizaRespCivil
    insurancePolicy: z
      .string()
      .min(
        1,
        "La póliza de responsabilidad civil es requerida para Carta Porte",
      )
      .max(50, "Máximo 50 caracteres"),
  })
  .superRefine(applyRemolquesConditional);

// ============================================
// Edit Vehicle Form Schema — CP3.1 laxo (legacy-safe)
// ============================================

/**
 * Schema usado por el formulario en modo edición. Mantiene los CP3.1
 * opcionales para no bloquear ediciones sobre vehículos legacy sin estos
 * datos. El pre-stamp API (`validateVehicleForCartaPorteStamp`) sigue
 * bloqueando el timbrado si faltan; aquí sólo se permite editar otros
 * campos sin tener que completar todo el nodo Autotransporte.
 */
export const editVehicleFormSchema = z
  .object({
    ...vehicleFormCommonShape,
    satTipoPermisoCode: z
      .string()
      .max(10, "Máximo 10 caracteres")
      .optional()
      .or(z.literal("")),
    sctPermitNumber: z
      .string()
      .max(50, "Máximo 50 caracteres")
      .optional()
      .or(z.literal("")),
    satConfigAutotransporteCode: z
      .string()
      .max(10, "Máximo 10 caracteres")
      .optional()
      .or(z.literal("")),
    pesoBrutoVehicular: vehicleFormPesoBrutoSchema,
    insuranceCompany: z
      .string()
      .max(50, "Máximo 50 caracteres")
      .optional()
      .or(z.literal("")),
    insurancePolicy: z
      .string()
      .max(50, "Máximo 50 caracteres")
      .optional()
      .or(z.literal("")),
  })
  .superRefine(applyRemolquesConditional);

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
  currentMileage: vehicleFormCurrentMileageSchema,

  // Documentation
  insurancePolicy: z.string().max(50).nullable().optional(),
  insuranceExpiry: z.string().nullable().optional(),
  sctPermitNumber: z.string().max(50).nullable().optional(),
  sctPermitExpiry: z.string().nullable().optional(),

  // Carta Porte 3.1 — Autotransporte
  satTipoPermisoCode: z.string().max(10).nullable().optional(),
  satConfigAutotransporteCode: z.string().max(10).nullable().optional(),
  pesoBrutoVehicular: z.preprocess(
    preprocessPesoBrutoVehicular,
    z.number().positive().max(9999.999).nullable().optional(),
  ),
  insuranceCompany: z.string().max(50).nullable().optional(),
  aseguraMedioAmbiente: z.string().max(50).nullable().optional(),
  polizaMedioAmbiente: z.string().max(30).nullable().optional(),
  aseguraCarga: z.string().max(50).nullable().optional(),
  polizaCarga: z.string().max(30).nullable().optional(),
  remolques: z.array(remolqueSchema).max(2, "Máximo 2 remolques").optional(),

  // Status
  status: vehicleStatusSchema.optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Type Exports
// ============================================

/**
 * Tipo del formulario de vehículo (alta y edición).
 *
 * Se infiere del schema **laxo** (`editVehicleFormSchema`) para que el handler
 * de submit y los `defaultValues` sean compatibles con ambos modos. En alta,
 * `createVehicleSchema` los enforces como requeridos en runtime; en edición,
 * mantiene flexibilidad para vehículos legacy.
 */
export type CreateVehicleFormData = z.infer<typeof editVehicleFormSchema>;
export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;

/** Campos por paso del wizard de alta (índices 0–2); el paso 3 es solo revisión. */
export const VEHICLE_CREATE_WIZARD_STEP_FIELDS: (keyof CreateVehicleFormData)[][] = [
  [
    "unitNumber",
    "licensePlate",
    "vin",
    "brand",
    "model",
    "year",
    "type",
    "color",
    "branchId",
    "currentMileage",
  ],
  [
    "loadCapacity",
    "volumeCapacity",
    "fuelTankCapacity",
    "expectedFuelEfficiency",
    "insuranceCompany",
    "insurancePolicy",
    "insuranceExpiry",
    "satTipoPermisoCode",
    "sctPermitNumber",
    "sctPermitExpiry",
  ],
  [
    "satConfigAutotransporteCode",
    "pesoBrutoVehicular",
    "aseguraMedioAmbiente",
    "polizaMedioAmbiente",
    "aseguraCarga",
    "polizaCarga",
    "remolques",
  ],
];
