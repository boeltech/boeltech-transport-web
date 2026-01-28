/**
 * Auth Schemas
 *
 * Schemas de validación con Zod para formularios de auth.
 *
 * Ubicación: src/features/auth/ui/schemas.ts
 */

import { z } from "zod";

// ============================================
// LOGIN SCHEMA
// ============================================

/**
 * Schema de validación para el formulario de login
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

export type LoginFormData = z.infer<typeof loginSchema>;

// ============================================
// FORGOT PASSWORD SCHEMA
// ============================================

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

// ============================================
// RESET PASSWORD SCHEMA
// ============================================

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
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número",
      ),

    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================
// REGISTER SCHEMA
// ============================================

/**
 * Schema para registro de usuario
 */
// export const registerSchema = z
//   .object({
//     firstName: z
//       .string()
//       .min(1, "El nombre es requerido")
//       .min(2, "El nombre debe tener al menos 2 caracteres"),

//     lastName: z
//       .string()
//       .min(1, "El apellido es requerido")
//       .min(2, "El apellido debe tener al menos 2 caracteres"),

//     email: z
//       .string()
//       .min(1, "El correo electrónico es requerido")
//       .email("Ingresa un correo electrónico válido"),

//     password: z
//       .string()
//       .min(1, "La contraseña es requerida")
//       .min(8, "La contraseña debe tener al menos 8 caracteres")
//       .regex(
//         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
//         "La contraseña debe contener al menos una mayúscula, una minúscula y un número",
//       ),

//     confirmPassword: z.string().min(1, "Confirma tu contraseña"),

//     subdomain: z
//       .string()
//       .min(1, "La empresa es requerida")
//       .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),

//     acceptTerms: z.boolean().refine((val) => val === true, {
//       message: "Debes aceptar los términos y condiciones",
//     }),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Las contraseñas no coinciden",
//     path: ["confirmPassword"],
//   });

// export type RegisterFormData = z.infer<typeof registerSchema>;

export const registerSchema = z
  .object({
    // Empresa
    companyName: z
      .string()
      .min(1, "El nombre de la empresa es requerido")
      .min(2, "Mínimo 2 caracteres"),
    subdomain: z
      .string()
      .min(1, "El identificador es requerido")
      .min(3, "Mínimo 3 caracteres")
      .max(50, "Máximo 50 caracteres")
      .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),

    // Admin
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    email: z.string().min(1, "El correo es requerido").email("Correo inválido"),
    password: z
      .string()
      .min(1, "La contraseña es requerida")
      .min(8, "Mínimo 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Debe contener mayúscula, minúscula y número",
      ),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),

    // Terms
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
