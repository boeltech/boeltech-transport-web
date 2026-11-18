import { z } from "zod";
import {
  internalStaffSchema,
  refineTrailersForConfig,
  tripTrailerAssignmentFormSchema,
  type InternalStaffFormValues,
} from "../../pages/create/components/validation";

/** Vacío / NaN → undefined (no convertir "" en 0). */
const startMileageFieldSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "number" && Number.isNaN(value)) return undefined;
    return value;
  },
  z
    .number({ error: "Kilometraje inválido" })
    .int("Kilometraje inválido")
    .min(0, "El kilometraje no puede ser negativo")
    .optional(),
);

export const FLEET_INCOMING_ODOMETER_REQUIRED_MESSAGE =
  "Indica el kilometraje (odómetro) de la unidad que asignas.";

export type TripFleetAssignmentSchemaOptions = {
  /** Unidad actual del viaje (sin cambio = no exigir / no enviar odómetro). */
  originalVehicleId: string;
  /**
   * Política B: obligatorio al cambiar unidad si el viaje está in_progress
   * o ya tenía start_mileage (incluye 0).
   */
  requireIncomingOdometer: boolean;
};

const fleetAssignmentObjectSchema = z.object({
  vehicleId: z.string().min(1, "Unidad requerida"),
  driverId: z.string().min(1, "Conductor requerido"),
  trailers: z.array(tripTrailerAssignmentFormSchema).max(2).default([]),
  satConfigAutotransporteCode: z.string().optional().or(z.literal("")),
  internalStaff: z.array(internalStaffSchema).default([]),
  allowExpiredDocs: z.boolean().default(false),
  /** Odómetro de la unidad entrante; solo aplica si cambia vehicleId. */
  startMileage: startMileageFieldSchema,
});

/**
 * Schema del sheet «Flota y tripulación».
 * Soft-busy en draft es decisión de producto (aviso UI); no se hard-bloquea aquí.
 * El hard-block de recursos busy aplica en UI cuando softBusySelectable=false.
 */
export function createTripFleetAssignmentSchema(
  options: TripFleetAssignmentSchemaOptions,
) {
  return fleetAssignmentObjectSchema.superRefine((data, ctx) => {
    refineTrailersForConfig(data, ctx);

    const assigned = new Set<string>();

    for (let index = 0; index < data.internalStaff.length; index++) {
      const member = data.internalStaff[index];
      const id = member.employeeId;

      if (assigned.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["internalStaff", index, "employeeId"],
          message: "Este empleado ya fue agregado",
        });
      } else {
        assigned.add(id);
      }
    }

    const vehicleChanging =
      Boolean(data.vehicleId) &&
      data.vehicleId !== options.originalVehicleId;
    if (
      vehicleChanging &&
      options.requireIncomingOdometer &&
      data.startMileage == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startMileage"],
        message: FLEET_INCOMING_ODOMETER_REQUIRED_MESSAGE,
      });
    }
  });
}

/** Schema sin obligatoriedad de odómetro (tests / default). */
export const tripFleetAssignmentSchema = createTripFleetAssignmentSchema({
  originalVehicleId: "",
  requireIncomingOdometer: false,
});

export type TripFleetAssignmentFormValues = z.infer<
  typeof fleetAssignmentObjectSchema
>;

export type { InternalStaffFormValues };
