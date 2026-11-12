import { z } from "zod";

import {
  DEFAULT_MID_TRIP_PAYOUT_POLICY,
  MID_TRIP_PAYOUT_POLICIES,
} from "@features/settlements/domain/enums";
import { normalizeCorridorRefValue } from "../utils/corridorMatchKey";

const MID_TRIP_PAYOUT_POLICY_REQUIRED_MESSAGE =
  "Selecciona cómo repartir el pago si cambia el operador a medio viaje.";

export const compensationTemplateRuleSchema = z.object({
  routeType: z.enum(["local", "long_haul", "transfer"]),
  commissionType: z.enum([
    "rate_per_km",
    "percentage_of_freight",
    "fixed_per_trip",
    "none",
  ]),
  rateValue: z.coerce.number().min(0),
  minimumGuaranteedAmount: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const templateFixedAllowanceSchema = z.object({
  allowanceType: z.enum([
    "meals",
    "transport",
    "per_diem",
    "lodging",
    "fuel_allowance",
    "tolls_allowance",
    "employer_contribution",
    "other",
  ]),
  label: z.string().min(1).max(80),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  period: z.enum(["weekly", "biweekly", "monthly"]),
  isMandatory: z.boolean().default(true),
});

export const templateDeductionSchema = z.object({
  deductionType: z.enum([
    "savings_fund",
    "tax_withholding",
    "union_dues",
    "equipment_rental",
    "other_deduction",
  ]),
  label: z.string().min(1).max(80),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  period: z.enum(["weekly", "biweekly", "monthly"]),
  isMandatory: z.boolean().default(true),
});

const DUPLICATE_ROUTE_TYPE_MESSAGE =
  "Ya hay una regla para esta clase de ruta. Solo se permite una por clase (Local, Foráneo o Transfer / Patio).";

function addUniqueRouteTypeIssues(
  rules: Array<{ routeType: string }>,
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[] = ["rules"],
): void {
  const seen = new Map<string, number>();
  rules.forEach((rule, index) => {
    const previous = seen.get(rule.routeType);
    if (previous !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: DUPLICATE_ROUTE_TYPE_MESSAGE,
        path: [...pathPrefix, index, "routeType"],
      });
      return;
    }
    seen.set(rule.routeType, index);
  });
}

export const compensationTemplateFormSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio").max(120),
    description: z.string().max(2000).optional().nullable(),
    isActive: z.boolean().default(true),
    midTripPayoutPolicy: z.preprocess(
      (value) =>
        value === "" || value == null ? DEFAULT_MID_TRIP_PAYOUT_POLICY : value,
      z
        .enum(MID_TRIP_PAYOUT_POLICIES, {
          error: MID_TRIP_PAYOUT_POLICY_REQUIRED_MESSAGE,
        })
        .default(DEFAULT_MID_TRIP_PAYOUT_POLICY),
    ),
    paymentPeriod: z.enum(["weekly", "biweekly", "monthly"]).default("weekly"),
    salaryOnly: z.boolean().default(false),
    rules: z.array(compensationTemplateRuleSchema).default([]),
    fixedAllowances: z.array(templateFixedAllowanceSchema).default([]),
    deductions: z.array(templateDeductionSchema).default([]),
    corridorIds: z.array(z.string().uuid()).default([]),
  })
  .superRefine((data, ctx) => {
    addUniqueRouteTypeIssues(data.rules, ctx);
  });

export type CompensationTemplateFormData = z.infer<typeof compensationTemplateFormSchema>;

export const compensationTemplateCreateFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
  paymentPeriod: z.enum(["weekly", "biweekly", "monthly"]).default("weekly"),
  salaryOnly: z.boolean().default(false),
});

export type CompensationTemplateCreateFormData = z.infer<
  typeof compensationTemplateCreateFormSchema
>;

const corridorTariffCommonFields = {
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  fixedAmount: z.coerce
    .number({ error: "Indica la tarifa fija" })
    .positive("La tarifa debe ser mayor a 0"),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
};

/**
 * Create + edit city↔city + conversión a ciudad.
 * Refs literales `city_label` (POST/PATCH conversión).
 */
export const corridorTariffCreateFormSchema = z
  .object({
    ...corridorTariffCommonFields,
    originRefType: z.literal("city_label"),
    originRefValue: z.string().min(1, "Indica la ciudad de origen").max(120),
    destinationRefType: z.literal("city_label"),
    destinationRefValue: z.string().min(1, "Indica la ciudad de destino").max(120),
  })
  .transform((data) => ({
    ...data,
    originRefValue: normalizeCorridorRefValue("city_label", data.originRefValue),
    destinationRefValue: normalizeCorridorRefValue("city_label", data.destinationRefValue),
  }));

/**
 * Soft edit de fila legacy (branch/CP): no exige ciudad;
 * el submit omite refs (API conserva la definición).
 */
export const corridorTariffLegacySoftFormSchema = z.object({
  ...corridorTariffCommonFields,
  originRefType: z.enum(["branch", "city_label", "postal_code"]),
  originRefValue: z.string(),
  destinationRefType: z.enum(["branch", "city_label", "postal_code"]),
  destinationRefValue: z.string(),
});

/** Alias histórico → schema create estrecho (solo ciudad). */
export const corridorTariffFormSchema = corridorTariffCreateFormSchema;

export type CorridorTariffFormData = z.output<typeof corridorTariffCreateFormSchema>;
export type CorridorTariffFormInput = z.input<typeof corridorTariffCreateFormSchema>;
export type CorridorTariffLegacySoftFormData = z.output<
  typeof corridorTariffLegacySoftFormSchema
>;
export type CorridorTariffLegacySoftFormInput = z.input<
  typeof corridorTariffLegacySoftFormSchema
>;

export const batchAssignmentFormSchema = z
  .object({
    employeeIds: z
      .array(z.string().uuid())
      .min(1, "Selecciona al menos un operador")
      .max(100, "Máximo 100 operadores por asignación"),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    effectiveTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
      .optional()
      .nullable()
      .or(z.literal("")),
    closePreviousAssignment: z.boolean().default(true),
    reason: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.effectiveTo?.trim()) return true;
      return data.effectiveFrom <= data.effectiveTo.trim();
    },
    { message: "La fecha fin debe ser posterior o igual al inicio", path: ["effectiveTo"] },
  );

export type BatchAssignmentFormData = z.infer<typeof batchAssignmentFormSchema>;
