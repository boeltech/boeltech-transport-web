/**
 * Client Address Form Validation Schema
 * Clean Architecture - Presentation Layer
 *
 * Schema Zod para validación del formulario de dirección de cliente.
 * Incluye campos Carta Porte 3.1.
 *
 * Ubicación: src/features/clients/presentation/validation/clientAddressSchema.ts
 */

import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const addressTypeSchema = z.enum(
  ["billing", "shipping", "pickup", "warehouse", "office", "other"],
  {
    required_error: "Seleccione el tipo de dirección",
  },
);

// ============================================================================
// CLIENT ADDRESS FORM SCHEMA
// ============================================================================

/**
 * Schema para el formulario de dirección de cliente
 * Campos Carta Porte 3.1 obligatorios: Estado, Municipio, Código Postal
 */
export const clientAddressFormSchema = z.object({
  // ═══════════════════════════════════════════════════════════════════════
  // TIPO Y CONFIGURACIÓN
  // ═══════════════════════════════════════════════════════════════════════
  addressType: addressTypeSchema.default("billing"),

  isPrimary: z.boolean().default(false),

  locationName: z
    .string()
    .max(200, "El nombre del lugar es muy largo")
    .optional()
    .or(z.literal("")),

  // ═══════════════════════════════════════════════════════════════════════
  // CAMPOS CARTA PORTE 3.1 - UBICACIÓN SAT (OBLIGATORIOS)
  // ═══════════════════════════════════════════════════════════════════════
  satEstadoCode: z
    .string()
    .min(1, "El estado es requerido")
    .max(3, "Código de estado inválido"),

  satMunicipioCode: z
    .string()
    .min(1, "El municipio es requerido")
    .max(5, "Código de municipio inválido"),

  postalCode: z
    .string()
    .min(5, "El código postal debe tener 5 dígitos")
    .max(5, "El código postal debe tener 5 dígitos")
    .regex(/^\d{5}$/, "El código postal debe ser numérico de 5 dígitos"),

  // ═══════════════════════════════════════════════════════════════════════
  // CAMPOS CARTA PORTE 3.1 - UBICACIÓN SAT (OPCIONALES)
  // ═══════════════════════════════════════════════════════════════════════
  satLocalidadCode: z
    .string()
    .max(4, "Código de localidad inválido")
    .optional()
    .or(z.literal("")),

  satColoniaCode: z
    .string()
    .max(7, "Código de colonia inválido")
    .optional()
    .or(z.literal("")),

  // ═══════════════════════════════════════════════════════════════════════
  // DIRECCIÓN DESGLOSADA
  // ═══════════════════════════════════════════════════════════════════════
  street: z
    .string()
    .max(100, "La calle es muy larga")
    .optional()
    .or(z.literal("")),

  exteriorNumber: z
    .string()
    .max(20, "El número exterior es muy largo")
    .optional()
    .or(z.literal("")),

  interiorNumber: z
    .string()
    .max(20, "El número interior es muy largo")
    .optional()
    .or(z.literal("")),

  reference: z
    .string()
    .max(250, "La referencia es muy larga")
    .optional()
    .or(z.literal("")),

  // ═══════════════════════════════════════════════════════════════════════
  // DATOS REMITENTE/DESTINATARIO (CARTA PORTE)
  // ═══════════════════════════════════════════════════════════════════════
  rfcRemitenteDestinatario: z
    .string()
    .max(13, "El RFC es muy largo")
    .optional()
    .or(z.literal("")),

  nombreRemitenteDestinatario: z
    .string()
    .max(254, "El nombre es muy largo")
    .optional()
    .or(z.literal("")),

  // ═══════════════════════════════════════════════════════════════════════
  // COORDENADAS (OPCIONALES)
  // ═══════════════════════════════════════════════════════════════════════
  latitude: z
    .number()
    .min(-90, "Latitud inválida")
    .max(90, "Latitud inválida")
    .optional()
    .nullable(),

  longitude: z
    .number()
    .min(-180, "Longitud inválida")
    .max(180, "Longitud inválida")
    .optional()
    .nullable(),

  // ═══════════════════════════════════════════════════════════════════════
  // CONTACTO EN ESTA DIRECCIÓN
  // ═══════════════════════════════════════════════════════════════════════
  contactName: z
    .string()
    .max(200, "El nombre del contacto es muy largo")
    .optional()
    .or(z.literal("")),

  contactPhone: z
    .string()
    .max(20, "El teléfono es muy largo")
    .optional()
    .or(z.literal("")),

  contactEmail: z
    .string()
    .email("El correo electrónico no es válido")
    .optional()
    .or(z.literal("")),

  // ═══════════════════════════════════════════════════════════════════════
  // OPERACIÓN
  // ═══════════════════════════════════════════════════════════════════════
  businessHours: z
    .string()
    .max(200, "El horario es muy largo")
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .max(1000, "Las notas son muy largas")
    .optional()
    .or(z.literal("")),

  specialInstructions: z
    .string()
    .max(1000, "Las instrucciones son muy largas")
    .optional()
    .or(z.literal("")),
});

// ============================================================================
// BILLING ADDRESS SCHEMA (Para wizard - dirección fiscal obligatoria)
// ============================================================================

/**
 * Schema específico para dirección fiscal en el wizard
 * addressType se fuerza a 'billing' e isPrimary a true
 */
export const billingAddressFormSchema = clientAddressFormSchema.extend({
  addressType: z.literal("billing").default("billing"),
  isPrimary: z.literal(true).default(true),
});

// ============================================================================
// TYPES
// ============================================================================

export type ClientAddressFormData = z.infer<typeof clientAddressFormSchema>;
export type BillingAddressFormData = z.infer<typeof billingAddressFormSchema>;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const defaultClientAddressFormValues: ClientAddressFormData = {
  addressType: "shipping",
  isPrimary: false,
  locationName: "",
  // Campos SAT obligatorios
  satEstadoCode: "",
  satMunicipioCode: "",
  postalCode: "",
  // Campos SAT opcionales
  satLocalidadCode: "",
  satColoniaCode: "",
  // Dirección desglosada
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  reference: "",
  // Remitente/Destinatario
  rfcRemitenteDestinatario: "",
  nombreRemitenteDestinatario: "",
  // Coordenadas
  latitude: null,
  longitude: null,
  // Contacto
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  // Operación
  businessHours: "",
  notes: "",
  specialInstructions: "",
};

export const defaultBillingAddressFormValues: BillingAddressFormData = {
  ...defaultClientAddressFormValues,
  addressType: "billing",
  isPrimary: true,
};

// ============================================================================
// UPDATE SCHEMA (para edición)
// ============================================================================

export const updateClientAddressFormSchema = clientAddressFormSchema
  .partial()
  .extend({
    // Mantener los campos SAT como requeridos incluso en edición
    satEstadoCode: z.string().min(1, "El estado es requerido"),
    satMunicipioCode: z.string().min(1, "El municipio es requerido"),
    postalCode: z.string().min(5, "El código postal es requerido"),
  });

export type UpdateClientAddressFormData = z.infer<
  typeof updateClientAddressFormSchema
>;
