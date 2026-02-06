/**
 * Types for Trip Wizard
 * Tipos compartidos entre los componentes del wizard
 */

import { z } from "zod";

// ============================================================================
// FORM SCHEMAS
// ============================================================================

/**
 * Schema para una parada del viaje
 * ACTUALIZADO: stopType ahora es un array
 */
export const tripStopSchema = z.object({
  id: z.string().optional(), // Para edición
  sequenceOrder: z.number().min(0),
  stopType: z
    .array(z.enum(["origin", "pickup", "delivery", "waypoint", "destination"]))
    .min(1, "Debe seleccionar al menos un tipo de parada"),

  // Asociación con cliente y dirección
  clientId: z.string().optional(), // Cliente asociado a esta parada
  clientAddressId: z.string().optional(), // Dirección del cliente

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
});

/**
 * Schema para una carga
 */
export const tripCargoSchema = z.object({
  id: z.string().optional(), // Para edición
  clientId: z.string().min(1, "Cliente requerido"),
  description: z.string().min(1, "Descripción requerida"),
  productType: z.string().optional(),
  weight: z.coerce.number().min(0).optional(),
  volume: z.coerce.number().min(0).optional(),
  units: z.coerce.number().min(0).optional(),
  declaredValue: z.coerce.number().min(0).optional(),
  rate: z.coerce.number().min(0, "Tarifa requerida"),
  currency: z.string().default("MXN"),
  pickupStopIndex: z.number().optional(), // Índice de la parada de recogida
  deliveryStopIndex: z.number().optional(), // Índice de la parada de entrega
  notes: z.string().optional(),
  specialInstructions: z.string().optional(),
});

/**
 * Schema para un gasto/costo
 */
export const tripExpenseSchema = z.object({
  id: z.string().optional(), // Para edición
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
  isEstimated: z.boolean().default(true), // true = estimado, false = real
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
    vehicleCurrentMileage: z.number().optional(), // Kilometraje actual del vehículo (para validación)

    // Paso 2: Ruta (paradas: primera = origen, última = destino)
    stops: z
      .array(tripStopSchema)
      .min(2, "Debe agregar al menos origen y destino")
      .default([]),

    // Paso 3: Cargas
    cargos: z.array(tripCargoSchema).default([]),

    // Paso 4: Costos
    expenses: z.array(tripExpenseSchema).default([]),
    baseRate: z.coerce.number().min(0).optional(), // Tarifa base del viaje

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
      // Validar que el kilometraje inicial no sea menor al kilometraje actual del vehículo
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
      // Validar que la primera parada incluya "origin" o "pickup"
      if (data.stops.length > 0) {
        const firstStopTypes = data.stops[0].stopType;
        const hasValidType = firstStopTypes.some(
          (type) => type === "origin" || type === "pickup",
        );
        if (!hasValidType) {
          return false;
        }
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
      // Validar que la última parada incluya "destination" o "delivery"
      if (data.stops.length > 0) {
        const lastStopTypes = data.stops[data.stops.length - 1].stopType;
        const hasValidType = lastStopTypes.some(
          (type) => type === "destination" || type === "delivery",
        );
        if (!hasValidType) {
          return false;
        }
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
      // Validar que las paradas intermedias solo incluyan "pickup", "delivery" o "waypoint"
      if (data.stops.length > 2) {
        const middleStops = data.stops.slice(1, -1);
        const invalidMiddleStop = middleStops.find((stop) => {
          return stop.stopType.some(
            (type) =>
              type !== "pickup" && type !== "delivery" && type !== "waypoint",
          );
        });
        if (invalidMiddleStop) {
          return false;
        }
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
