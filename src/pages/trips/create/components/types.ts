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
 */
export const tripStopSchema = z.object({
  id: z.string().optional(), // Para edición
  sequenceOrder: z.number().min(0),
  stopType: z.enum(["origin", "pickup", "delivery", "waypoint", "destination"]),
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
    startMileage: z.coerce.number().min(0).optional(),

    // Paso 2: Ruta (origen, destino y paradas intermedias)
    originAddress: z.string().min(1, "Dirección de origen requerida"),
    originCity: z.string().min(1, "Ciudad de origen requerida"),
    originState: z.string().optional(),
    destinationAddress: z.string().min(1, "Dirección de destino requerida"),
    destinationCity: z.string().min(1, "Ciudad de destino requerida"),
    destinationState: z.string().optional(),
    stops: z.array(tripStopSchema).default([]),

    // Paso 3: Cargas
    cargos: z.array(tripCargoSchema).default([]),

    // Paso 4: Costos
    expenses: z.array(tripExpenseSchema).default([]),
    baseRate: z.coerce.number().min(0).optional(), // Tarifa base del viaje

    // Notas generales
    notes: z.string().max(1000).optional(),
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
    description: "Origen, destino y paradas",
    fields: [
      "originAddress",
      "originCity",
      "originState",
      "destinationAddress",
      "destinationCity",
      "destinationState",
      "stops",
    ],
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

export const defaultWizardFormValues: TripWizardFormValues = {
  vehicleId: "",
  driverId: "",
  clientId: "",
  scheduledDeparture: "",
  scheduledArrival: "",
  startMileage: undefined,
  originAddress: "",
  originCity: "",
  originState: "",
  destinationAddress: "",
  destinationCity: "",
  destinationState: "",
  stops: [],
  cargos: [],
  expenses: [],
  baseRate: undefined,
  notes: "",
};
