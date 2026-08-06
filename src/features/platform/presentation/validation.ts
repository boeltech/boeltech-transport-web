import { z } from "zod";
import { platformCopy } from "./copy/platformCopy";

const createValidation = platformCopy.tenants.create.validation;

export const platformLoginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type PlatformLoginFormData = z.infer<typeof platformLoginSchema>;

export const platformMfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, "Ingresa el código de 6 dígitos")
    .max(64, "Código demasiado largo"),
});

export type PlatformMfaCodeFormData = z.infer<typeof platformMfaCodeSchema>;

export const createPlatformTenantSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, createValidation.companyNameRequired)
    .max(255, createValidation.companyNameMax),
  subdomain: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, createValidation.subdomainMin)
    .max(50, createValidation.subdomainMax)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, createValidation.subdomainFormat),
  adminEmail: z.string().trim().email(createValidation.adminEmailInvalid),
  adminPassword: z
    .string()
    .min(8, createValidation.adminPasswordMin)
    .max(128, createValidation.adminPasswordMax)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      createValidation.adminPasswordComplexity,
    ),
  adminFirstName: z
    .string()
    .trim()
    .min(1, createValidation.adminFirstNameRequired)
    .max(100, createValidation.adminFirstNameMax),
  adminLastName: z
    .string()
    .trim()
    .min(1, createValidation.adminLastNameRequired)
    .max(100, createValidation.adminLastNameMax),
  planCode: z.string().min(1, createValidation.planRequired),
  declaredFleetBand: z
    .enum(["1_10", "11_30", "31_100", "100_plus"])
    .optional()
    .nullable(),
});

export type CreatePlatformTenantFormData = z.infer<
  typeof createPlatformTenantSchema
>;

export const assignPlatformPlanSchema = z.object({
  planCode: z.string().min(1, "Selecciona un plan"),
});

export type AssignPlatformPlanFormData = z.infer<typeof assignPlatformPlanSchema>;

export const suspendPlatformTenantSchema = z.object({
  reason: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type SuspendPlatformTenantFormData = z.infer<
  typeof suspendPlatformTenantSchema
>;

export const managePlatformSubscriptionSchema = z.object({
  planCode: z.string().min(1, "Selecciona un plan"),
  status: z.enum(["trialing", "active", "past_due", "paused", "canceled"]),
  billingCycle: z.enum(["monthly", "annual"]),
  trialEndsAt: z.string().optional(),
  notes: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

export type ManagePlatformSubscriptionFormData = z.infer<
  typeof managePlatformSubscriptionSchema
>;

import { isClosedBillingPeriodKey } from "./utils/billingPeriod";

const issueCopy = platformCopy.ar.issue;

export const issueSaasInvoiceSchema = z.object({
  periodKey: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Usa el formato AAAA-MM (ej. 2026-07)")
    .refine((value) => isClosedBillingPeriodKey(value), {
      message: issueCopy.periodKeyClosedOnly,
    }),
  notes: z.string().max(2000).optional(),
  dueDays: z.coerce.number().int().min(1).max(90).optional().default(14),
});

export type IssueSaasInvoiceFormData = z.infer<typeof issueSaasInvoiceSchema>;

export const markSaasInvoicePaidSchema = z.object({
  paidAt: z.string().min(1, "Indica la fecha de pago"),
  method: z.enum(["manual", "spei", "card_external", "other"]),
  reference: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type MarkSaasInvoicePaidFormData = z.infer<
  typeof markSaasInvoicePaidSchema
>;

export const voidSaasInvoiceSchema = z.object({
  voidReason: z.string().max(2000).optional(),
});

export type VoidSaasInvoiceFormData = z.infer<typeof voidSaasInvoiceSchema>;
