import { z } from "zod";

import { normalizeCorridorRefValue } from "../utils/corridorMatchKey";

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
  allowanceType: z.enum(["meals", "transport", "other"]),
  label: z.string().min(1).max(80),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  period: z.enum(["weekly", "biweekly", "monthly"]),
  isMandatory: z.boolean().default(true),
});

export const compensationTemplateFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
  midTripPayoutPolicy: z
    .enum([
      "split_by_assigned_km",
      "equal_parts",
      "pay_only_closer",
      "pay_only_dispatcher",
    ])
    .default("split_by_assigned_km"),
  rules: z.array(compensationTemplateRuleSchema).default([]),
  fixedAllowances: z.array(templateFixedAllowanceSchema).default([]),
  corridorIds: z.array(z.string().uuid()).default([]),
});

export type CompensationTemplateFormData = z.infer<typeof compensationTemplateFormSchema>;

export const compensationTemplateCreateFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CompensationTemplateCreateFormData = z.infer<
  typeof compensationTemplateCreateFormSchema
>;

type CorridorRefType = "branch" | "city_label" | "postal_code";

const POSTAL_CODE_PATTERN = /^\d{5}$/;

function addBranchRefValueIssues(
  ctx: z.RefinementCtx,
  refType: CorridorRefType,
  refValue: string,
  valuePath: "originRefValue" | "destinationRefValue",
): void {
  if (refType !== "branch") return;

  if (!z.string().uuid().safeParse(refValue).success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        valuePath === "originRefValue"
          ? "Selecciona una sucursal válida para el origen"
          : "Selecciona una sucursal válida para el destino",
      path: [valuePath],
    });
  }
}

function addPostalCodeRefValueIssues(
  ctx: z.RefinementCtx,
  refType: CorridorRefType,
  refValue: string,
  valuePath: "originRefValue" | "destinationRefValue",
): void {
  if (refType !== "postal_code") return;

  const trimmed = refValue.trim();
  if (!POSTAL_CODE_PATTERN.test(trimmed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        valuePath === "originRefValue"
          ? "El código postal de origen debe tener 5 dígitos"
          : "El código postal de destino debe tener 5 dígitos",
      path: [valuePath],
    });
  }
}

export const corridorTariffFormSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio").max(120),
    originRefType: z.enum(["branch", "city_label", "postal_code"]),
    originRefValue: z.string().min(1, "Indica el origen").max(120),
    destinationRefType: z.enum(["branch", "city_label", "postal_code"]),
    destinationRefValue: z.string().min(1, "Indica el destino").max(120),
    fixedAmount: z.coerce
      .number({ error: "Indica la tarifa fija" })
      .positive("La tarifa debe ser mayor a 0"),
    notes: z.string().max(2000).optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    addBranchRefValueIssues(ctx, data.originRefType, data.originRefValue, "originRefValue");
    addBranchRefValueIssues(
      ctx,
      data.destinationRefType,
      data.destinationRefValue,
      "destinationRefValue",
    );
    addPostalCodeRefValueIssues(ctx, data.originRefType, data.originRefValue, "originRefValue");
    addPostalCodeRefValueIssues(
      ctx,
      data.destinationRefType,
      data.destinationRefValue,
      "destinationRefValue",
    );
  })
  .transform((data) => ({
    ...data,
    originRefValue: normalizeCorridorRefValue(data.originRefType, data.originRefValue),
    destinationRefValue: normalizeCorridorRefValue(
      data.destinationRefType,
      data.destinationRefValue,
    ),
  }));

export type CorridorTariffFormData = z.output<typeof corridorTariffFormSchema>;
export type CorridorTariffFormInput = z.input<typeof corridorTariffFormSchema>;

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
