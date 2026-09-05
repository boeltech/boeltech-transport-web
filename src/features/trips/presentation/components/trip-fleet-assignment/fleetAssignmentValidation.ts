import { z } from "zod";
import {
  internalStaffSchema,
  refineTrailersForConfig,
  tripTrailerAssignmentFormSchema,
  type InternalStaffFormValues,
} from "../../pages/create/components/validation";

/**
 * Schema del sheet «Flota y tripulación».
 * Soft-busy en draft es decisión de producto (aviso UI); no se hard-bloquea aquí.
 * El hard-block de recursos busy aplica en UI cuando softBusySelectable=false.
 */
export const tripFleetAssignmentSchema = z
  .object({
    vehicleId: z.string().min(1, "Unidad requerida"),
    driverId: z.string().min(1, "Conductor requerido"),
    trailers: z.array(tripTrailerAssignmentFormSchema).max(2).default([]),
    satConfigAutotransporteCode: z.string().optional().or(z.literal("")),
    internalStaff: z.array(internalStaffSchema).default([]),
    allowExpiredDocs: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
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
  });

export type TripFleetAssignmentFormValues = z.infer<
  typeof tripFleetAssignmentSchema
>;

export type { InternalStaffFormValues };
