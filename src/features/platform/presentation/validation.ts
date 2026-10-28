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
  reason: z
    .string()
    .trim()
    .min(10, "La razón debe tener entre 10 y 500 caracteres")
    .max(500, "La razón debe tener entre 10 y 500 caracteres"),
});

export type AssignPlatformPlanFormData = z.infer<typeof assignPlatformPlanSchema>;

/** Preview add-on (activate) — sin reason en API (audit MODULE_ENTITLED). */
export const attachPlatformAddonSchema = z.object({
  moduleCode: z.string().min(1, "Selecciona un complemento"),
});

export type AttachPlatformAddonFormData = z.infer<
  typeof attachPlatformAddonSchema
>;

export const suspendPlatformTenantSchema = z.object({
  reason: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export type SuspendPlatformTenantFormData = z.infer<
  typeof suspendPlatformTenantSchema
>;

/** Suspend tipado F1 + confirmación tipada PRD (match se valida en UI). */
export const typedSuspendPlatformTenantSchema = z
  .object({
    reasonCode: z.enum([
      "past_due_policy",
      "customer_request",
      "abuse",
      "other",
    ]),
    reasonDetail: z
      .string()
      .max(500, "Máximo 500 caracteres")
      .optional()
      .or(z.literal("")),
    confirmation: z
      .string()
      .trim()
      .min(1, "Escribe el identificador de la empresa para confirmar"),
  })
  .superRefine((data, ctx) => {
    if (data.reasonCode === "other" && !data.reasonDetail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reasonDetail"],
        message: "Describe el motivo cuando eliges Otro",
      });
    }
    if (
      data.reasonCode === "other" &&
      data.reasonDetail &&
      data.reasonDetail.trim().length > 0 &&
      data.reasonDetail.trim().length < 3
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reasonDetail"],
        message: "Mínimo 3 caracteres",
      });
    }
  });

export type TypedSuspendPlatformTenantFormData = z.infer<
  typeof typedSuspendPlatformTenantSchema
>;

/** Normaliza para comparar subdomain o nombre comercial. */
export function matchesTypedTenantConfirmation(
  input: string,
  tenant: { name: string; subdomain: string },
): boolean {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized === tenant.subdomain.trim().toLowerCase() ||
    normalized === tenant.name.trim().toLowerCase()
  );
}

export const rotateAdminCredentialsSchema = z.object({
  password: z
    .string()
    .min(8, createValidation.adminPasswordMin)
    .max(128, createValidation.adminPasswordMax)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      createValidation.adminPasswordComplexity,
    ),
  resendActivation: z.boolean().default(true),
});

export type RotateAdminCredentialsFormData = z.infer<
  typeof rotateAdminCredentialsSchema
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
  status: z.enum(["draft", "open"]).default("open"),
  notes: z.string().max(2000).optional(),
  dueDays: z.coerce.number().int().min(1).max(90).optional().default(14),
});

export type IssueSaasInvoiceFormData = z.infer<typeof issueSaasInvoiceSchema>;

export const MARK_SAAS_INVOICE_PAID_METHODS = [
  "manual",
  "spei",
  "card_external",
  "other",
] as const;

export const markSaasInvoicePaidSchema = z.object({
  paidAt: z.string().min(1, "Indica la fecha de pago"),
  method: z.enum(MARK_SAAS_INVOICE_PAID_METHODS),
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
