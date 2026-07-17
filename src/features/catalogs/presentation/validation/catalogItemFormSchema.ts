import { z } from "zod";
import { catalogsCopy } from "../copy/catalogsCopy";

export const catalogItemFormSchema = z.object({
  code: z
    .string()
    .min(1, "El código es requerido")
    .max(50, "El código no puede exceder 50 caracteres")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "El código solo puede contener letras, números, guiones y guiones bajos",
    ),
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres"),
  description: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional(),
  parentCode: z
    .string()
    .max(50, "El código padre no puede exceder 50 caracteres")
    .optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CatalogItemFormValues = z.infer<typeof catalogItemFormSchema>;

export const catalogItemEditFormSchema = catalogItemFormSchema.omit({ code: true });

export type CatalogItemEditFormValues = z.infer<typeof catalogItemEditFormSchema>;

export const catalogItemFormLabels = catalogsCopy.itemForm.fields;
