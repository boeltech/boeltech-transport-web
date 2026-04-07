/**
 * Trip Wizard Validation Schemas
 * Clean Architecture - Presentation Layer (Validation)
 *
 * Schemas Zod para el wizard de creación de viajes.
 * Incluye validaciones para Carta Porte 3.1.
 *
 * ACTUALIZADO: Campos de dirección unificados con Carta Porte
 * - Eliminados campos duplicados (address, city, state como texto libre)
 * - Todos los campos geográficos usan catálogos SAT
 * - Validaciones coherentes con requerimientos fiscales
 *
 * Ubicación: src/features/trips/presentation/pages/create/validation.ts
 */

import { z } from "zod";

// ============================================================================
// STOP SCHEMA (Carta Porte 3.1 - Campos Unificados)
// ============================================================================

/**
 * Schema para una parada del viaje
 *
 * IMPORTANTE: Los campos de dirección están unificados con los requerimientos
 * de Carta Porte 3.1. NO hay campos duplicados.
 *
 * Campos geográficos SAT obligatorios:
 * - satEstadoCode (c_Estado)
 * - satMunicipioCode (c_Municipio)
 * - postalCode (c_CodigoPostal)
 *
 * Campos geográficos SAT opcionales:
 * - satLocalidadCode (c_Localidad)
 * - satColoniaCode (c_Colonia)
 */
export const tripStopSchema = z.object({
  id: z.string().optional(),
  sequenceOrder: z.number().min(0),
  stopType: z
    .array(z.enum(["origin", "pickup", "delivery", "waypoint", "destination"]))
    .min(1, "Debe seleccionar al menos un tipo de parada"),

  // ── Asociación con cliente (opcional) ───────────────────────────────────
  clientId: z.string().optional(),
  clientAddressId: z.string().optional(),

  // ── Identificación del lugar ────────────────────────────────────────────
  locationName: z.string().optional(), // Nombre del lugar (ej: "Bodega Central")

  // ── Ubicación SAT (Carta Porte 3.1) ─────────────────────────────────────
  /**
   * Código de Estado SAT (c_Estado)
   * OBLIGATORIO para Carta Porte
   */
  satEstadoCode: z
    .string()
    .min(1, "El estado es requerido")
    .max(3, "Código de estado inválido"),

  /**
   * Código de Municipio SAT (c_Municipio)
   * OBLIGATORIO para Carta Porte
   * Formato: código estado + código municipio (ej: "001" para Aguascalientes)
   */
  satMunicipioCode: z
    .string()
    .min(1, "El municipio es requerido")
    .max(5, "Código de municipio inválido"),

  /**
   * Código Postal (c_CodigoPostal)
   * OBLIGATORIO para Carta Porte
   * 5 dígitos
   */
  postalCode: z
    .string()
    .min(5, "Código postal debe tener 5 dígitos")
    .max(5, "Código postal debe tener 5 dígitos")
    .regex(/^\d{5}$/, "Código postal inválido"),

  /**
   * Código de Localidad SAT (c_Localidad)
   * OPCIONAL - Usado principalmente en zonas rurales
   */
  satLocalidadCode: z.string().optional(),

  /**
   * Nombre del municipio (texto del catálogo SAT)
   * Se usa como `city` en los campos legacy del viaje
   */
  cityName: z.string().max(200).optional(),

  /**
   * Código de Colonia SAT (c_Colonia)
   * OPCIONAL - Ayuda a precisar la ubicación
   */
  satColoniaCode: z.string().optional(),

  /**
   * Nombre/descripción de la colonia (texto del catálogo SAT)
   * Se envía al backend como campo `colonia` en la parada
   */
  colonia: z.string().max(200, "Nombre de colonia muy largo").optional(),

  // ── Dirección desglosada ────────────────────────────────────────────────
  /**
   * Calle
   */
  street: z.string().max(100, "Calle muy larga").optional(),

  /**
   * Número exterior
   */
  exteriorNumber: z.string().max(20, "Número exterior muy largo").optional(),

  /**
   * Número interior
   */
  interiorNumber: z.string().max(20, "Número interior muy largo").optional(),

  /**
   * Referencia (entre calles, cerca de...)
   */
  reference: z.string().max(250, "Referencia muy larga").optional(),

  // ── Coordenadas (opcional, para mapas) ──────────────────────────────────
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  // ── Remitente / Destinatario ────────────────────────────────────────────
  /**
   * RFC del remitente (origen) o destinatario (destino)
   */
  rfcRemitenteDestinatario: z
    .string()
    .max(13, "RFC inválido")
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, "Formato de RFC inválido")
    .optional()
    .or(z.literal("")),

  /**
   * Nombre o razón social del remitente/destinatario
   */
  nombreRemitenteDestinatario: z
    .string()
    .max(254, "Nombre muy largo")
    .optional(),

  // ── Contacto en sitio ───────────────────────────────────────────────────
  contactName: z.string().max(100, "Nombre muy largo").optional(),
  contactPhone: z.string().max(20, "Teléfono muy largo").optional(),

  // ── Tiempos ─────────────────────────────────────────────────────────────
  estimatedArrival: z.string().optional(), // ISO 8601

  // ── Notas ───────────────────────────────────────────────────────────────
  notes: z.string().max(500, "Notas muy largas").optional(),

  // ── Distancia (Carta Porte) ─────────────────────────────────────────────
  /**
   * Distancia en kilómetros desde la parada anterior
   * OBLIGATORIO para Carta Porte (excepto en origen)
   */
  distanceFromPreviousKm: z.coerce
    .number()
    .min(0, "La distancia no puede ser negativa")
    .optional(),
});

// ============================================================================
// CARGO MOVEMENT SCHEMA
// ============================================================================

export const cargoMovementSchema = z.object({
  stopIndex: z.number().min(0, "Parada requerida"),
  movementType: z.enum(["pickup", "delivery"]),
  weight: z.coerce.number().min(0).optional(),
  units: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

// ============================================================================
// CARGO SCHEMA
// ============================================================================

/**
 * Schema para una mercancía del viaje
 * Alineado con los campos que usa CargoStep y con Carta Porte 3.1
 */
export const tripCargoSchema = z.object({
  id: z.string().optional(),

  // Cliente asociado
  clientId: z.string().optional(),

  // Clasificación SAT (Carta Porte 3.1)
  satProductCode: z.string().optional(), // c_ClaveProdServCP
  satProductDescription: z.string().optional(), // Descripción del catálogo (referencia)
  satUnitCode: z.string().optional(), // c_ClaveUnidad
  satUnitName: z.string().optional(), // Nombre de la unidad (referencia)

  // Descripción
  description: z.string().min(1, "Descripción requerida"),

  // Cantidades
  units: z.coerce.number().min(1, "La cantidad debe ser mayor a 0").optional(),
  weight: z.coerce.number().min(0, "El peso no puede ser negativo").optional(),
  weightInKg: z.coerce.number().min(0, "El peso no puede ser negativo").optional(), // Carta Porte

  // Seguro de carga
  // El valor declarado es opcional y solo aplica cuando la mercancía está asegurada.
  // ValorMercancia en Carta Porte 3.1 — no es obligatorio, solo para efectos del seguro.
  isInsured: z.boolean().default(false),
  declaredValue: z.coerce.number().min(0, "El valor no puede ser negativo").optional(),

  // NOTA FUTURA: Los campos `rate` y `currency` fueron eliminados del nivel de carga.
  // Para implementar viajes consolidados (grupaje/LTL multi-cliente), se deberá agregar
  // una tabla de prorrateo de tarifa por carga/cliente derivada de la tarifa base del viaje.

  // Material peligroso (Carta Porte 3.1)
  hazardousMaterial: z.boolean().default(false),
  hazardousMaterialCode: z.string().optional(), // c_MaterialPeligroso
  packagingType: z.string().optional(), // c_TipoEmbalaje
  packagingDescription: z.string().optional(),

  // Movimientos en paradas
  movements: z.array(cargoMovementSchema).optional(),

  // Notas
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
});

// ============================================================================
// EXPENSE SCHEMA
// ============================================================================

export const tripExpenseSchema = z.object({
  id: z.string().optional(),

  // Clasificación
  category: z.enum([
    "fuel",
    "tolls",
    "driver_allowance",
    "lodging",
    "loading_unloading",
    "parking",
    "maintenance",
    "insurance",
    "permits",
    "other",
  ]),

  // Descripción y monto
  description: z.string().min(1, "Descripción requerida"),
  amount: z.coerce.number().min(0, "El monto no puede ser negativo"),
  currency: z.string().default("MXN"),

  // Proveedor (opcional, para referencia operativa)
  vendorName: z.string().optional(),

  // Notas
  notes: z.string().optional(),

  // Flag de planeación
  isEstimated: z.boolean().default(true),

  // NOTA FUTURA: Los campos de contabilidad (CFDI UUID, RFC del proveedor,
  // clave SAT, forma de pago, tipo de cambio) deben capturarse en el módulo
  // de liquidación post-viaje, no durante la planeación.
});

// ============================================================================
// FULL WIZARD SCHEMA
// ============================================================================

export const tripWizardSchema = z.object({
  // Paso 1: Información Básica
  vehicleId: z.string().min(1, "Vehículo requerido"),
  driverId: z.string().min(1, "Conductor requerido"),
  clientId: z.string().optional(),
  scheduledDeparture: z.string().min(1, "Fecha de salida requerida"),
  // Derivado del estimatedArrival de la parada de destino (Paso 2)
  scheduledArrival: z.string().optional(),
  startMileage: z.coerce.number().min(0).optional(),
  vehicleCurrentMileage: z.coerce.number().min(0).optional(),

  // Transporte Internacional
  transpInternac: z.boolean().default(false),
  entradaSalidaMerc: z.enum(["Entrada", "Salida"]).optional(),
  paisOrigenDestino: z.string().optional(), // c_Pais

  // Paso 2: Ruta
  stops: z.array(tripStopSchema).min(2, "Se requieren al menos 2 paradas"),

  // Paso 3: Carga
  cargos: z.array(tripCargoSchema),

  // Paso 4: Costos
  expenses: z.array(tripExpenseSchema),
  baseRate: z.coerce.number().min(0).optional(),

  // Paso 5: Notas
  notes: z.string().optional(),
});

// ============================================================================
// TYPES INFERRED FROM SCHEMAS
// ============================================================================

export type TripStopFormValues = z.infer<typeof tripStopSchema>;
export type CargoMovementFormValues = z.infer<typeof cargoMovementSchema>;
export type TripCargoFormValues = z.infer<typeof tripCargoSchema>;
export type TripExpenseFormValues = z.infer<typeof tripExpenseSchema>;
export type TripWizardFormValues = z.infer<typeof tripWizardSchema>;

// ============================================================================
// WIZARD STEPS CONFIGURATION
// ============================================================================

export const WIZARD_STEPS = [
  {
    id: "basic",
    title: "Información",
    description: "Asignaciones y programación",
    fields: [
      "vehicleId",
      "driverId",
      "clientId",
      "scheduledDeparture",
      "startMileage",
      "transpInternac",
    ],
  },
  {
    id: "route",
    title: "Ruta",
    description: "Paradas del viaje",
    fields: ["stops"],
  },
  {
    id: "cargo",
    title: "Cargas",
    description: "Mercancías a transportar",
    fields: ["cargos"],
  },
  {
    id: "costs",
    title: "Costos",
    description: "Gastos estimados",
    fields: ["expenses", "baseRate"],
  },
  {
    id: "summary",
    title: "Resumen",
    description: "Confirmar y crear",
    fields: ["notes"],
  },
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const defaultWizardFormValues: Partial<TripWizardFormValues> = {
  vehicleId: "",
  driverId: "",
  clientId: "",
  scheduledDeparture: "",
  scheduledArrival: "",
  startMileage: undefined,
  vehicleCurrentMileage: undefined,
  transpInternac: false,
  stops: [],
  cargos: [],
  expenses: [],
  baseRate: undefined,
  notes: "",
};

// ============================================================================
// DEFAULT STOP VALUES
// ============================================================================

export const defaultStopFormValues: Partial<TripStopFormValues> = {
  stopType: [],
  clientId: "",
  clientAddressId: "",
  locationName: "",
  satEstadoCode: "",
  satMunicipioCode: "",
  postalCode: "",
  satLocalidadCode: "",
  satColoniaCode: "",
  cityName: "",
  colonia: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  reference: "",
  rfcRemitenteDestinatario: "",
  nombreRemitenteDestinatario: "",
  contactName: "",
  contactPhone: "",
  notes: "",
  distanceFromPreviousKm: undefined,
};

// ============================================================================
// ROUTE STEP VALIDATION HELPER
// ============================================================================

export interface RouteStepValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida el paso de Ruta para mostrar mensajes específicos
 */
export function validateRouteStep(
  stops: TripStopFormValues[],
): RouteStepValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const originStops = stops.filter((stop) => stop.stopType.includes("origin"));
  const destinationStops = stops.filter((stop) =>
    stop.stopType.includes("destination"),
  );
  const waypointStops = stops.filter(
    (stop) =>
      stop.stopType.includes("waypoint") &&
      !stop.stopType.includes("origin") &&
      !stop.stopType.includes("destination"),
  );

  // Validar origen
  if (originStops.length === 0) {
    errors.push("Falta agregar la parada de origen");
  } else if (originStops.length > 1) {
    errors.push("Solo puede existir una parada de origen");
  }

  // Validar destino
  if (destinationStops.length === 0) {
    errors.push("Falta agregar la parada de destino");
  } else if (destinationStops.length > 1) {
    errors.push("Solo puede existir una parada de destino");
  }

  // Validar que origen tenga pickup
  if (originStops.length === 1) {
    const origin = originStops[0];
    if (!origin.stopType.includes("pickup")) {
      errors.push("La parada de origen debe tener operación de carga");
    }
  }

  // Validar que destino tenga delivery
  if (destinationStops.length === 1) {
    const destination = destinationStops[0];
    if (!destination.stopType.includes("delivery")) {
      errors.push("La parada de destino debe tener operación de descarga");
    }
  }

  // Validar escalas
  for (let i = 0; i < waypointStops.length; i++) {
    const waypoint = waypointStops[i];
    const hasOperation =
      waypoint.stopType.includes("pickup") ||
      waypoint.stopType.includes("delivery");

    if (!hasOperation) {
      const label = waypoint.locationName || `Escala ${i + 1}`;
      errors.push(`La escala "${label}" no tiene operación asignada`);
    }
  }

  // Validar campos Carta Porte en cada parada
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const label = stop.locationName || `Parada ${i + 1}`;

    if (!stop.satEstadoCode) {
      errors.push(`"${label}" no tiene estado SAT`);
    }
    if (!stop.satMunicipioCode) {
      errors.push(`"${label}" no tiene municipio SAT`);
    }
    if (!stop.postalCode) {
      errors.push(`"${label}" no tiene código postal`);
    }

    // Distancia obligatoria excepto en origen
    if (i > 0 && !stop.distanceFromPreviousKm && stop.distanceFromPreviousKm !== 0) {
      warnings.push(`"${label}" no tiene distancia desde la parada anterior`);
    }

    // estimatedArrival obligatorio en destino, recomendado en waypoints
    const isDestination = stop.stopType.includes("destination");
    const isWaypoint =
      stop.stopType.includes("waypoint") &&
      !stop.stopType.includes("origin") &&
      !stop.stopType.includes("destination");

    if (isDestination && !stop.estimatedArrival) {
      errors.push(`"${label}" requiere hora estimada de llegada (FechaHoraSalidaLlegada en Carta Porte)`);
    } else if (isWaypoint && !stop.estimatedArrival) {
      warnings.push(`"${label}" no tiene hora estimada de llegada. Se calculará por interpolación al generar la Carta Porte.`);
    }
  }

  // Advertencias
  if (waypointStops.length === 0 && errors.length === 0) {
    warnings.push(
      "El viaje no tiene escalas intermedias. Esto es válido pero puede agregar escalas si necesita paradas adicionales.",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

