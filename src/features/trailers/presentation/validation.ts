import { z } from "zod";
import {
  isValidCp31Placa,
  normalizeCp31Placa,
} from "@boeltech/cfdi-domain";

const licensePlateField = z
  .string()
  .min(1, "La placa es requerida")
  .transform((val) => normalizeCp31Placa(val))
  .refine((val) => isValidCp31Placa(val), {
    message:
      "La placa debe tener 5 a 7 caracteres alfanuméricos (sin espacios ni guiones)",
  });

export const createTrailerFormSchema = z.object({
  licensePlate: licensePlateField,
  satSubTipoRemCode: z.string().min(1, "Selecciona el tipo de remolque."),
  notes: z.string().max(2000).optional().or(z.literal("")),
  branchId: z.string().uuid().optional().or(z.literal("")),
});

export type CreateTrailerFormData = z.infer<typeof createTrailerFormSchema>;

export const updateTrailerFormSchema = createTrailerFormSchema;
export type UpdateTrailerFormData = CreateTrailerFormData;
