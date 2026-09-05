/**
 * Settlement Validation Schemas
 * Clean Architecture - Presentation Layer (Validation)
 *
 * Schemas Zod para Acuerdos de Compensación, Anticipos y Liquidaciones.
 */

import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/** Monto > 0; ""/null/undefined → undefined (RHF empty) en lugar de coerce a 0/NaN. */
const positiveAmountField = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "string" && val.trim() === "") return undefined;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : undefined;
}, z.number({ error: "El monto debe ser mayor a 0" }).positive("El monto debe ser mayor a 0"));

const positiveDeductAmountField = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  if (typeof val === "string" && val.trim() === "") return undefined;
  const n = typeof val === "number" ? val : Number(val);
  return Number.isFinite(n) ? n : undefined;
}, z
  .number({ error: "El monto a deducir debe ser mayor a 0" })
  .positive("El monto a deducir debe ser mayor a 0"));

// ============================================================================
// 1. ACUERDO DE COMPENSACIÓN SCHEMA (ADR-0086 Compuesto + ADR-0085 Retrocompat)
// ============================================================================

export const compensationAgreementRuleSchema = z.object({
  id: z.string().optional(),
  routeType: z.enum(["local", "long_haul", "transfer"]),
  commissionType: z.enum([
    "rate_per_km",
    "percentage_of_freight",
    "fixed_per_trip",
    "none",
  ]),
  rateValue: z.coerce.number().min(0, "La tarifa no puede ser negativa").default(0),
  minimumGuaranteedAmount: z.coerce
    .number()
    .min(0, "El monto mínimo garantizado no puede ser negativo")
    .default(0),
  notes: z.string().max(255, "Máximo 255 caracteres").optional().or(z.literal("")),
});

export type CompensationAgreementRuleFormValues = z.infer<
  typeof compensationAgreementRuleSchema
>;

export const compensationAgreementFormSchema = z
  .object({
    employeeId: z.string().min(1, "El empleado es obligatorio"),
    // Campos compuestos (ADR-0086)
    hasFixedSalary: z.boolean().default(false),
    fixedSalaryAmount: z.coerce
      .number()
      .min(0, "El salario fijo no puede ser negativo")
      .default(0),
    fixedSalaryPeriod: z
      .enum(["weekly", "biweekly", "monthly", "none"])
      .default("weekly"),
    isSalaryGuaranteed: z.boolean().default(true),
    rules: z.array(compensationAgreementRuleSchema).default([]),
    // Campos planos (ADR-0085 compatibilidad)
    calculationType: z
      .enum([
        "fixed_per_trip",
        "rate_per_km",
        "percentage_of_freight",
        "fixed_daily_rate",
        "salary_only",
      ])
      .optional()
      .default("rate_per_km"),
    baseRate: z.coerce.number().min(0, "La tarifa base no puede ser negativa").default(0),
    ratePerKm: z.coerce.number().min(0, "La tarifa por km no puede ser negativa").default(0),
    percentageRate: z.coerce
      .number()
      .min(0, "El porcentaje no puede ser menor a 0")
      .max(100, "El porcentaje no puede exceder 100")
      .default(0),
    helperDailyRate: z.coerce.number().min(0, "La tarifa diaria no puede ser negativa").default(0),
    currency: z.enum(["MXN", "USD", "EUR"]).default("MXN"),
    effectiveFrom: z
      .string()
      .regex(dateRegex, "Formato de fecha inválido (AAAA-MM-DD)")
      .min(1, "Fecha de inicio obligatoria"),
    effectiveTo: z
      .string()
      .regex(dateRegex, "Formato de fecha inválido (AAAA-MM-DD)")
      .optional()
      .or(z.literal("")),
    notes: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (!data.effectiveTo || data.effectiveTo === "") return true;
      return data.effectiveFrom <= data.effectiveTo;
    },
    {
      message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
      path: ["effectiveTo"],
    },
  )
  .refine(
    (data) => {
      if (!data.rules || data.rules.length === 0) return true;
      const routeTypes = data.rules.map((r) => r.routeType);
      const uniqueRouteTypes = new Set(routeTypes);
      return uniqueRouteTypes.size === routeTypes.length;
    },
    {
      message: "No puede haber más de una regla para el mismo tipo de ruta",
      path: ["rules"],
    },
  )
  .refine(
    (data) => {
      const hasFixed = data.hasFixedSalary && (data.fixedSalaryAmount ?? 0) > 0;
      const hasRules = Boolean(data.rules && data.rules.length > 0);
      const hasLegacyRate =
        (data.baseRate ?? 0) > 0 ||
        (data.ratePerKm ?? 0) > 0 ||
        (data.percentageRate ?? 0) > 0 ||
        (data.helperDailyRate ?? 0) > 0 ||
        data.calculationType === "salary_only";

      return hasFixed || hasRules || hasLegacyRate;
    },
    {
      message: "Debe configurar al menos un sueldo fijo o una regla/tarifa de comisión",
      path: ["rules"],
    },
  );

export type CompensationAgreementFormValues = z.infer<
  typeof compensationAgreementFormSchema
>;
export type CompensationAgreementFormData = CompensationAgreementFormValues;

// ============================================================================
// 2. ANTICIPO A OPERADOR SCHEMA (ADR-0086 Circuito de Autorización)
// ============================================================================

export const driverAdvanceFormSchema = z.object({
  employeeId: z.string().min(1, "El empleado es obligatorio"),
  tripId: z.string().uuid("Viaje inválido").optional().or(z.literal("")),
  amount: positiveAmountField,
  currency: z.enum(["MXN", "USD", "EUR"]).default("MXN"),
  category: z.enum([
    "travel_advance",
    "fuel",
    "tolls",
    "per_diem",
    "cash_advance",
    "emergency",
  ]),
  paymentMethod: z
    .enum(["bank_transfer", "check", "cash", "electronic_wallet"])
    .default("bank_transfer"),
  bankReference: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  submitForApproval: z.boolean().default(true),
  notes: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

export type DriverAdvanceFormValues = z.infer<typeof driverAdvanceFormSchema>;
export type DriverAdvanceFormData = DriverAdvanceFormValues;

// ============================================================================
// 3. PREVIEW & CREACIÓN DE LIQUIDACIÓN SCHEMAS
// ============================================================================

export const previewSettlementQuerySchema = z
  .object({
    employeeId: z.string().min(1, "El empleado es obligatorio"),
    periodStart: z.string().regex(dateRegex, "Fecha de inicio inválida (AAAA-MM-DD)"),
    periodEnd: z.string().regex(dateRegex, "Fecha de fin inválida (AAAA-MM-DD)"),
    tripIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => data.periodStart <= data.periodEnd, {
    message: "El inicio del periodo debe ser menor o igual al fin del periodo",
    path: ["periodEnd"],
  });

export type PreviewSettlementQueryValues = z.infer<
  typeof previewSettlementQuerySchema
>;
export type PreviewSettlementQueryParams = PreviewSettlementQueryValues;

export const appliedAdvanceInputSchema = z.object({
  advanceId: z.string().min(1, "ID de anticipo requerido"),
  amountToDeduct: positiveDeductAmountField,
});

export const customSettlementItemInputSchema = z.object({
  itemType: z.enum([
    "trip_commission",
    "base_salary",
    "approved_expense_reimbursement",
    "advance_deduction",
    "bonus",
    "penalty_deduction",
    "tax_deduction",
    "adjustment",
  ]),
  description: z.string().min(1, "Descripción requerida").max(255),
  amount: positiveAmountField,
  isDeduction: z.boolean().default(false),
});

export const createSettlementFormSchema = z
  .object({
    employeeId: z.string().min(1, "El empleado es obligatorio"),
    periodStart: z.string().regex(dateRegex, "Fecha de inicio inválida (AAAA-MM-DD)"),
    periodEnd: z.string().regex(dateRegex, "Fecha de fin inválida (AAAA-MM-DD)"),
    tripIds: z.array(z.string().uuid()).default([]),
    advancesToApply: z.array(appliedAdvanceInputSchema).default([]),
    customItems: z
      .array(customSettlementItemInputSchema)
      .max(0, "Los ajustes manuales no están habilitados en esta versión")
      .default([]),
    notes: z.string().max(1000, "Máximo 1000 caracteres").optional().or(z.literal("")),
    submitForApproval: z.boolean().default(false),
  })
  .refine((data) => data.periodStart <= data.periodEnd, {
    message: "El inicio del periodo debe ser menor o igual al fin del periodo",
    path: ["periodEnd"],
  });

export type CreateSettlementFormValues = z.infer<
  typeof createSettlementFormSchema
>;
export type CreateSettlementFormData = CreateSettlementFormValues;

// ============================================================================
// 4. DISPERSIÓN DE LIQUIDACIÓN SCHEMA
// ============================================================================

export const disburseSettlementFormSchema = z.object({
  disbursementMethod: z.enum([
    "bank_transfer",
    "check",
    "cash",
    "electronic_wallet",
  ]),
  disbursementReference: z
    .string()
    .trim()
    .min(1, "La referencia o folio de pago es obligatoria")
    .max(100, "Máximo 100 caracteres"),
  disbursedAt: z.string().trim().min(1, "Fecha de pago obligatoria"),
  notes: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

export type DisburseSettlementFormValues = z.infer<
  typeof disburseSettlementFormSchema
>;
export type DisburseSettlementFormData = DisburseSettlementFormValues;
