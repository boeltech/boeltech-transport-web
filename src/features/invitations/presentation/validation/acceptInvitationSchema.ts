import { z } from "zod";
import { resetPasswordSchema } from "@features/auth";

/**
 * Aceptar invitación: contraseña (mismo criterio que reset) + nombre.
 */
export const acceptInvitationFormSchema = resetPasswordSchema.extend({
  firstName: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  lastName: z
    .string()
    .min(1, "El apellido es requerido")
    .max(100, "Máximo 100 caracteres"),
});

export type AcceptInvitationFormData = z.infer<typeof acceptInvitationFormSchema>;
