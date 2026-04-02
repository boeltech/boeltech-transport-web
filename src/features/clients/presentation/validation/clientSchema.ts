/**
 * Client Form Validation Schema
 * Clean Architecture - Presentation Layer
 *
 * Schema Zod para validación del formulario de cliente.
 * Solo contiene los campos del cliente, SIN dirección.
 *
 * NOTA: La dirección fiscal se valida en clientAddressSchema.ts
 *
 * Ubicación: src/features/clients/presentation/validation/clientSchema.ts
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const clientTypeSchema = z.enum(["individual", "company"], {
  required_error: "Seleccione el tipo de cliente",
});

export const paymentTermsSchema = z.enum(["cash", "credit"], {
  required_error: "Seleccione los términos de pago",
});

// ============================================================================
// CLIENT FORM SCHEMA (Paso 1 del Wizard)
// ============================================================================

/**
 * Schema para el formulario de información del cliente
 */
export const clientFormSchema = z
  .object({
    // ═══════════════════════════════════════════════════════════════════════
    // TIPO DE CLIENTE
    // ═══════════════════════════════════════════════════════════════════════
    type: clientTypeSchema.default("company"),

    // ═══════════════════════════════════════════════════════════════════════
    // INFORMACIÓN FISCAL
    // ═══════════════════════════════════════════════════════════════════════
    legalName: z
      .string()
      .min(1, "La razón social es requerida")
      .max(200, "La razón social es muy larga"),

    tradeName: z
      .string()
      .max(200, "El nombre comercial es muy largo")
      .optional()
      .or(z.literal("")),

    taxId: z
      .string()
      .min(12, "El RFC debe tener al menos 12 caracteres")
      .max(13, "El RFC debe tener máximo 13 caracteres")
      .regex(
        /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i,
        "El formato del RFC no es válido",
      ),

    taxRegime: z
      .string()
      .max(10, "El régimen fiscal es muy largo")
      .optional()
      .or(z.literal("")),

    // ═══════════════════════════════════════════════════════════════════════
    // CONTACTO PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════════
    contactName: z
      .string()
      .max(200, "El nombre del contacto es muy largo")
      .optional()
      .or(z.literal("")),

    contactPosition: z
      .string()
      .max(100, "El puesto es muy largo")
      .optional()
      .or(z.literal("")),

    phone: z
      .string()
      .max(20, "El teléfono es muy largo")
      .optional()
      .or(z.literal("")),

    secondaryPhone: z
      .string()
      .max(20, "El teléfono secundario es muy largo")
      .optional()
      .or(z.literal("")),

    email: z
      .string()
      .email("El correo electrónico no es válido")
      .optional()
      .or(z.literal("")),

    billingEmail: z
      .string()
      .email("El correo de facturación no es válido")
      .optional()
      .or(z.literal("")),

    // ═══════════════════════════════════════════════════════════════════════
    // TÉRMINOS COMERCIALES
    // ═══════════════════════════════════════════════════════════════════════
    paymentTerms: paymentTermsSchema.default("cash"),

    creditDays: z
      .number()
      .int("Los días de crédito deben ser un número entero")
      .min(0, "Los días de crédito no pueden ser negativos")
      .max(180, "Los días de crédito no pueden ser mayores a 180")
      .default(0),

    creditLimit: z
      .number()
      .min(0, "El límite de crédito no puede ser negativo")
      .optional()
      .or(z.literal(0)),

    // ═══════════════════════════════════════════════════════════════════════
    // NOTAS
    // ═══════════════════════════════════════════════════════════════════════
    notes: z
      .string()
      .max(2000, "Las notas son muy largas")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // Si es pago a crédito, los días de crédito deben ser mayores a 0
      if (data.paymentTerms === "credit" && data.creditDays <= 0) {
        return false;
      }
      return true;
    },
    {
      message: "Los días de crédito deben ser mayores a 0 para pago a crédito",
      path: ["creditDays"],
    },
  )
  .refine(
    (data) => {
      // Validar longitud de RFC según tipo de cliente
      const rfcLength = data.taxId.length;
      if (data.type === "company" && rfcLength !== 12) {
        return false;
      }
      if (data.type === "individual" && rfcLength !== 13) {
        return false;
      }
      return true;
    },
    {
      message:
        "El RFC debe tener 12 caracteres para persona moral o 13 para persona física",
      path: ["taxId"],
    },
  );

// ============================================================================
// TYPES
// ============================================================================

export type ClientFormData = z.infer<typeof clientFormSchema>;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const defaultClientFormValues: ClientFormData = {
  type: "company",
  legalName: "",
  tradeName: "",
  taxId: "",
  taxRegime: "",
  contactName: "",
  contactPosition: "",
  phone: "",
  secondaryPhone: "",
  email: "",
  billingEmail: "",
  paymentTerms: "cash",
  creditDays: 0,
  creditLimit: 0,
  notes: "",
};

// ============================================================================
// UPDATE SCHEMA (para edición)
// ============================================================================

/**
 * Schema para actualización de cliente
 * Todos los campos son opcionales excepto los que se están actualizando
 */
// export const updateClientFormSchema = clientFormSchema.partial();
export const updateClientFormSchema = clientFormSchema;

export type UpdateClientFormData = z.infer<typeof updateClientFormSchema>;
