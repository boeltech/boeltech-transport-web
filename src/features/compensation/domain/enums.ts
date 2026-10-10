export type FixedAllowanceType =
  | "meals"
  | "transport"
  | "per_diem"
  | "lodging"
  | "fuel_allowance"
  | "tolls_allowance"
  | "employer_contribution"
  | "other";

export const FIXED_ALLOWANCE_TYPE_LABELS: Record<FixedAllowanceType, string> = {
  meals: "Comidas",
  transport: "Transporte",
  per_diem: "Viáticos",
  lodging: "Hospedaje",
  fuel_allowance: "Combustible",
  tolls_allowance: "Casetas",
  employer_contribution: "Aportación patronal",
  other: "Otro pago fijo",
};

export type FixedAllowancePeriod = "weekly" | "biweekly" | "monthly";

export const FIXED_ALLOWANCE_PERIOD_LABELS: Record<FixedAllowancePeriod, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
};

export type TemplateDeductionType =
  | "savings_fund"
  | "tax_withholding"
  | "union_dues"
  | "equipment_rental"
  | "other_deduction";

export const TEMPLATE_DEDUCTION_TYPE_LABELS: Record<TemplateDeductionType, string> = {
  savings_fund: "Fondo de ahorro",
  tax_withholding: "Retención de impuestos",
  union_dues: "Cuota sindical",
  equipment_rental: "Renta de equipo",
  other_deduction: "Otra deducción",
};

export type CorridorRefType = "branch" | "city_label" | "postal_code";

export const CORRIDOR_REF_TYPE_LABELS: Record<CorridorRefType, string> = {
  branch: "Sucursal",
  city_label: "Ciudad",
  postal_code: "Código postal",
};

/** Lifecycle de tarifa de pago (ADR versionado). */
export type CompensationTemplateStatus = "draft" | "active" | "inactive";

/** Por qué una versión quedó `inactive` (api#59 F1). */
export type CompensationTemplateInactiveReason = "superseded" | "manual";

/** Por qué la configuración de una versión ya no se puede editar (api#59 F4). */
export type CompensationTemplateLockedReason = "used_in_settlements" | "superseded";

export const COMPENSATION_TEMPLATE_STATUS_LABELS: Record<
  CompensationTemplateStatus,
  string
> = {
  draft: "Borrador",
  active: "Activa",
  inactive: "Inactiva",
};

export type CompensationTemplateEventAction =
  | "created"
  | "activated"
  | "deactivated"
  | "version_created"
  | "config_updated"
  | "metadata_updated";

export const COMPENSATION_TEMPLATE_EVENT_ACTION_LABELS: Record<
  CompensationTemplateEventAction,
  string
> = {
  created: "Tarifa creada",
  activated: "Tarifa activada",
  deactivated: "Tarifa desactivada",
  version_created: "Nueva versión creada",
  config_updated: "Configuración actualizada",
  metadata_updated: "Datos actualizados",
};

/** Tope de operadores por lote y por vista previa (la API responde 400 arriba de esto). */
export const BATCH_ASSIGNMENT_MAX_EMPLOYEES = 100;

/** Causa de un operador omitido en el lote de asignaciones (api#63). */
export type BatchAssignmentConflictReason =
  | "overlap_close_disabled"
  | "previous_starts_on_or_after"
  | "period_settled";

export const BATCH_ASSIGNMENT_CONFLICT_REASONS: readonly BatchAssignmentConflictReason[] = [
  "overlap_close_disabled",
  "previous_starts_on_or_after",
  "period_settled",
];

/** Estado de una liquidación que congela días de asignación (api#62). */
export type AssignmentBlockingSettlementStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "disbursed";

export const COMPENSATION_ERROR_CODES = {
  TEMPLATE_CONFIG_LOCKED: "TEMPLATE_CONFIG_LOCKED",
  TEMPLATE_INVALID_STATUS_TRANSITION: "TEMPLATE_INVALID_STATUS_TRANSITION",
  TEMPLATE_NOT_ACTIVATABLE: "TEMPLATE_NOT_ACTIVATABLE",
  TEMPLATE_IN_USE: "TEMPLATE_IN_USE",
  OVERLAPPING_ACTIVE_ASSIGNMENT: "OVERLAPPING_ACTIVE_ASSIGNMENT",
  ASSIGNMENT_PERIOD_SETTLED: "ASSIGNMENT_PERIOD_SETTLED",
  ASSIGNMENT_IN_USE: "ASSIGNMENT_IN_USE",
} as const;
