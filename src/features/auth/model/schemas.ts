import { z } from "zod";

/**
 * Schema de validación para el formulario de login
 *
 * NOTA: Incluye `subdomain` porque el backend es multi-tenant
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Ingresa un correo electrónico válido"),

  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),

  subdomain: z
    .string()
    .min(1, "La empresa es requerida")
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),

  rememberMe: z.boolean().optional().default(false),
});

/**
 * Tipo inferido del schema
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema para recuperación de contraseña
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Ingresa un correo electrónico válido"),

  subdomain: z.string().min(1, "La empresa es requerida"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema para reset de contraseña
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
      ),

    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
