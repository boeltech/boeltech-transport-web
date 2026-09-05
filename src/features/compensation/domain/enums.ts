export type FixedAllowanceType = "meals" | "transport" | "other";

export const FIXED_ALLOWANCE_TYPE_LABELS: Record<FixedAllowanceType, string> = {
  meals: "Comidas",
  transport: "Transporte",
  other: "Otro pago fijo",
};

export type FixedAllowancePeriod = "weekly" | "biweekly" | "monthly";

export const FIXED_ALLOWANCE_PERIOD_LABELS: Record<FixedAllowancePeriod, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

export type CorridorRefType = "branch" | "city_label" | "postal_code";

export const CORRIDOR_REF_TYPE_LABELS: Record<CorridorRefType, string> = {
  branch: "Sucursal",
  city_label: "Ciudad",
  postal_code: "Código postal",
};
