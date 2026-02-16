/**
 * Types for Trip Wizard
 * Tipos compartidos entre los componentes del wizard
 *
 * ACTUALIZADO: Modelo Carga → Movimientos
 * - tripCargoSchema usa movements[] en lugar de pickupStopIndex/deliveryStopIndex
 * - cargoMovementSchema define pickup/delivery parciales
 */

import { z } from "zod";

// ============================================================================
// FORM SCHEMAS
// ============================================================================

/**
 * Schema para una parada del viaje
 * stopType es un array que combina categoría + operaciones
 */
export const tripStopSchema = z.object({
  id: z.string().optional(),
  sequenceOrder: z.number().min(0),
  stopType: z
    .array(z.enum(["origin", "pickup", "delivery", "waypoint", "destination"]))
    .min(1, "Debe seleccionar al menos un tipo de parada"),

  // Asociación con cliente y dirección
  clientId: z.string().optional(),
  clientAddressId: z.string().optional(),

  address: z.string().min(1, "Dirección requerida"),
  city: z.string().min(1, "Ciudad requerida"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  estimatedArrival: z.string().optional(),
  notes: z.string().optional(),

  // ── Carta Porte 3.1 — Domicilio desglosado ────────────────────
  street: z.string().optional(), // Calle
  exteriorNumber: z.string().optional(), // Número exterior
  interiorNumber: z.string().optional(), // Número interior
  colonia: z.string().optional(), // Colonia / Asentamiento
  reference: z.string().optional(), // Referencia geográfica

  // Claves SAT (catálogos oficiales)
  satEstadoCode: z.string().optional(), // c_Estado (ej: "MEX", "SLP")
  satMunicipioCode: z.string().optional(), // c_Municipio (ej: "028")
  satLocalidadCode: z.string().optional(), // c_Localidad (ej: "05")
  satColoniaCode: z.string().optional(), // c_Colonia (ej: "0001")

  // Remitente / Destinatario
  rfcRemitenteDestinatario: z.string().optional(), // RFC de quien envía/recibe

  // Distancia (obligatorio para destinos en Carta Porte)
  distanceToNextKm: z.coerce.number().min(0).optional(), // km desde ubicación anterior
});

/**
 * Schema para un movimiento de carga (pickup o delivery parcial/total)
 * Conecta una carga con una parada específica.
 *
 * - pickup:  la mercancía se recoge en esta parada
 * - delivery: la mercancía (parcial o total) se entrega en esta parada
 */
export const cargoMovementSchema = z.object({
  stopIndex: z.number().min(0, "Parada requerida"),
  movementType: z.enum(["pickup", "delivery"]),
  weight: z.coerce.number().min(0).optional(),
  units: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

/**
 * Schema para una carga
 *
 * El array `movements` reemplaza a pickupStopIndex / deliveryStopIndex.
 * Cada carga debe tener al menos 1 movimiento de tipo "pickup".
 * Puede tener 0..N movimientos de tipo "delivery" (entregas parciales).
 */
export const tripCargoSchema = z.object({
  id: z.string().optional(),
  clientId: z.string().min(1, "Cliente requerido"),
  description: z.string().min(1, "Descripción requerida"),
  productType: z.string().optional(),
  weight: z.coerce.number().min(0).optional(),
  volume: z.coerce.number().min(0).optional(),
  units: z.coerce.number().min(0).optional(),
  declaredValue: z.coerce.number().min(0).optional(),
  rate: z.coerce.number().min(0, "Tarifa requerida"),
  currency: z.string().default("MXN"),
  movements: z
    .array(cargoMovementSchema)
    .min(1, "Debe asignar al menos un punto de carga"),
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),

  // ── Carta Porte 3.1 — Mercancía ──────────────────────────────
  satProductCode: z.string().optional(), // c_ClaveProdServCP (8 dígitos, ej: "24131510")
  satUnitCode: z.string().optional(), // c_ClaveUnidad (ej: "KGM", "H87")
  satUnitName: z.string().optional(), // Nombre unidad (ej: "Kilogramo")
  weightInKg: z.coerce.number().min(0).optional(), // PesoEnKg (obligatorio para CP)
  dimensions: z.string().optional(), // Dimensiones empaque (ej: "50/40/30cm")

  // Material peligroso
  hazardousMaterial: z.boolean().optional(), // ¿Material peligroso?
  hazardousMaterialCode: z.string().optional(), // c_MaterialPeligroso (ej: "1203")
  packagingType: z.string().optional(), // c_TipoEmbalaje (ej: "4H2")
  packagingDescription: z.string().optional(), // Descripción del embalaje
});

/**
 * Schema para un gasto/costo
 */
export const tripExpenseSchema = z.object({
  id: z.string().optional(),
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
  description: z.string().min(1, "Descripción requerida"),
  amount: z.coerce.number().min(0, "Monto requerido"),
  currency: z.string().default("MXN"),
  expenseDate: z.string().optional(),
  location: z.string().optional(),
  vendorName: z.string().optional(),
  notes: z.string().optional(),
  isEstimated: z.boolean().default(true),
});

/**
 * Schema principal del formulario del wizard
 */
export const tripWizardFormSchema = z
  .object({
    // Paso 1: Información básica
    vehicleId: z.string().min(1, "Seleccione un vehículo"),
    driverId: z.string().min(1, "Seleccione un conductor"),
    clientId: z.string().optional(),
    scheduledDeparture: z.string().min(1, "Fecha de salida requerida"),
    scheduledArrival: z.string().optional(),
    startMileage: z.coerce.number("Kilometraje inicial requerido"),
    vehicleCurrentMileage: z.number().optional(),

    // Paso 2: Ruta
    stops: z
      .array(tripStopSchema)
      .min(2, "Debe agregar al menos origen y destino")
      .default([]),

    // Paso 3: Cargas
    cargos: z.array(tripCargoSchema).default([]),

    // Paso 4: Costos
    expenses: z.array(tripExpenseSchema).default([]),
    baseRate: z.coerce.number().min(0).optional(),

    // Notas generales
    notes: z.string().max(1000).optional(),

    // Campos legacy (se calculan desde stops)
    originAddress: z.string().optional(),
    originCity: z.string().optional(),
    originState: z.string().optional(),
    destinationAddress: z.string().optional(),
    destinationCity: z.string().optional(),
    destinationState: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.scheduledArrival && data.scheduledDeparture) {
        return (
          new Date(data.scheduledArrival) > new Date(data.scheduledDeparture)
        );
      }
      return true;
    },
    {
      message: "La fecha de llegada debe ser posterior a la de salida",
      path: ["scheduledArrival"],
    },
  )
  .refine(
    (data) => {
      if (
        data.startMileage !== undefined &&
        data.vehicleCurrentMileage !== undefined
      ) {
        return data.startMileage >= data.vehicleCurrentMileage;
      }
      return true;
    },
    {
      message:
        "El kilometraje inicial no puede ser menor al kilometraje actual del vehículo",
      path: ["startMileage"],
    },
  )
  .refine(
    (data) => {
      if (data.stops.length > 0) {
        const firstStopTypes = data.stops[0].stopType;
        return firstStopTypes.some(
          (type) => type === "origin" || type === "pickup",
        );
      }
      return true;
    },
    {
      message: "La primera parada debe incluir 'Origen' o 'Carga'",
      path: ["stops"],
    },
  )
  .refine(
    (data) => {
      if (data.stops.length > 0) {
        const lastStopTypes = data.stops[data.stops.length - 1].stopType;
        return lastStopTypes.some(
          (type) => type === "destination" || type === "delivery",
        );
      }
      return true;
    },
    {
      message: "La última parada debe incluir 'Destino' o 'Descarga'",
      path: ["stops"],
    },
  )
  .refine(
    (data) => {
      if (data.stops.length > 2) {
        const middleStops = data.stops.slice(1, -1);
        return !middleStops.some((stop) =>
          stop.stopType.some(
            (type) =>
              type !== "pickup" && type !== "delivery" && type !== "waypoint",
          ),
        );
      }
      return true;
    },
    {
      message:
        "Las paradas intermedias solo pueden incluir 'Carga', 'Descarga' o 'Escala'",
      path: ["stops"],
    },
  );

// ============================================================================
// TYPES
// ============================================================================

export type TripWizardFormValues = z.infer<typeof tripWizardFormSchema>;
export type TripStopFormValues = z.infer<typeof tripStopSchema>;
export type TripCargoFormValues = z.infer<typeof tripCargoSchema>;
export type CargoMovementFormValues = z.infer<typeof cargoMovementSchema>;
export type TripExpenseFormValues = z.infer<typeof tripExpenseSchema>;

/**
 * Definición de un paso del wizard
 */
export interface WizardStepDefinition {
  id: string;
  title: string;
  description: string;
  fields: (keyof TripWizardFormValues)[];
}

/**
 * Configuración de los pasos del wizard
 */
export const WIZARD_STEPS: WizardStepDefinition[] = [
  {
    id: "basic-info",
    title: "Información",
    description: "Asignaciones y programación",
    fields: [
      "vehicleId",
      "driverId",
      "clientId",
      "scheduledDeparture",
      "scheduledArrival",
      "startMileage",
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
  stops: [],
  cargos: [],
  expenses: [],
  baseRate: undefined,
  notes: "",
};
