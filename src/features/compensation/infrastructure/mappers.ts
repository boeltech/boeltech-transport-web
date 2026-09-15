import { deepToCamel } from "@shared/api";
import type {
  AgreementCommissionType,
  MidTripPayoutPolicy,
  TripRouteType,
} from "@features/settlements";
import { DEFAULT_MID_TRIP_PAYOUT_POLICY } from "@features/settlements/domain/enums";
import type {
  BatchAssignmentConflict,
  BatchAssignmentResult,
  CompensationTemplate,
  CompensationTemplateRule,
  FixedAllowanceOverride,
  RouteCorridorTariff,
  TemplateAssignment,
  TemplateFixedAllowance,
} from "../domain/entities";
import type {
  CorridorRefType,
  FixedAllowancePeriod,
  FixedAllowanceType,
} from "../domain/enums";

export interface ApiCompensationTemplateRuleRaw {
  id?: string;
  route_type: string;
  commission_type: string;
  rate_value: number;
  minimum_guaranteed_amount: number;
  notes?: string | null;
  sort_order?: number;
}

export interface ApiTemplateFixedAllowanceRaw {
  id?: string;
  allowance_type: string;
  label: string;
  amount: number;
  period: string;
  is_mandatory: boolean;
}

export interface ApiRouteCorridorTariffRaw {
  id: string;
  name: string;
  origin_ref_type: string;
  origin_ref_value: string;
  destination_ref_type: string;
  destination_ref_value: string;
  fixed_amount: number;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCompensationTemplateRaw {
  id: string;
  tenant_id?: string;
  name: string;
  description: string | null;
  is_active: boolean;
  mid_trip_payout_policy?: string;
  rules: ApiCompensationTemplateRuleRaw[];
  fixed_allowances: ApiTemplateFixedAllowanceRaw[];
  corridor_ids: string[];
  corridors: ApiRouteCorridorTariffRaw[];
  active_assignments_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiTemplateAssignmentRaw {
  id: string;
  tenant_id?: string;
  employee_id: string;
  employee_full_name?: string | null;
  template_id: string;
  template_name?: string | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  assigned_by?: string | null;
  reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiBatchAssignmentConflictRaw {
  employee_id: string;
  code: string;
  existing_assignment_id?: string;
  message?: string;
}

export interface ApiBatchAssignmentResultRaw {
  created_count: number;
  skipped_count: number;
  conflicts: ApiBatchAssignmentConflictRaw[];
  created: ApiTemplateAssignmentRaw[];
}

export function mapTemplateRule(raw: ApiCompensationTemplateRuleRaw): CompensationTemplateRule {
  return {
    id: raw.id,
    routeType: raw.route_type as TripRouteType,
    commissionType: raw.commission_type as AgreementCommissionType,
    rateValue: raw.rate_value,
    minimumGuaranteedAmount: raw.minimum_guaranteed_amount ?? 0,
    notes: raw.notes ?? null,
    sortOrder: raw.sort_order,
  };
}

export function mapFixedAllowance(raw: ApiTemplateFixedAllowanceRaw): TemplateFixedAllowance {
  return {
    id: raw.id,
    allowanceType: raw.allowance_type as FixedAllowanceType,
    label: raw.label,
    amount: raw.amount,
    period: raw.period as FixedAllowancePeriod,
    isMandatory: raw.is_mandatory,
  };
}

export function mapCorridor(raw: ApiRouteCorridorTariffRaw): RouteCorridorTariff {
  return {
    id: raw.id,
    name: raw.name,
    originRefType: raw.origin_ref_type as CorridorRefType,
    originRefValue: raw.origin_ref_value,
    destinationRefType: raw.destination_ref_type as CorridorRefType,
    destinationRefValue: raw.destination_ref_value,
    fixedAmount: raw.fixed_amount,
    notes: raw.notes ?? null,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function mapTemplate(raw: ApiCompensationTemplateRaw): CompensationTemplate {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isActive: raw.is_active,
    midTripPayoutPolicy:
      (raw.mid_trip_payout_policy as MidTripPayoutPolicy | undefined) ??
      DEFAULT_MID_TRIP_PAYOUT_POLICY,
    rules: (raw.rules ?? []).map(mapTemplateRule),
    fixedAllowances: (raw.fixed_allowances ?? []).map(mapFixedAllowance),
    corridorIds: raw.corridor_ids ?? [],
    corridors: (raw.corridors ?? []).map(mapCorridor),
    activeAssignmentsCount: raw.active_assignments_count ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function mapAssignment(raw: ApiTemplateAssignmentRaw): TemplateAssignment {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeFullName: raw.employee_full_name ?? null,
    templateId: raw.template_id,
    templateName: raw.template_name ?? null,
    effectiveFrom: raw.effective_from,
    effectiveTo: raw.effective_to,
    isActive: raw.is_active,
    assignedBy: raw.assigned_by ?? null,
    reason: raw.reason ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export interface ApiFixedAllowanceOverrideRaw {
  id: string;
  employee_id: string;
  allowance_id: string;
  period_start: string;
  period_end: string;
  is_suspended: boolean;
  created_by?: string | null;
  created_at?: string;
}

export function mapFixedAllowanceOverride(
  raw: ApiFixedAllowanceOverrideRaw,
): FixedAllowanceOverride {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    allowanceId: raw.allowance_id,
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    isSuspended: raw.is_suspended,
    createdBy: raw.created_by ?? null,
    createdAt: raw.created_at,
  };
}

export function mapBatchConflict(raw: ApiBatchAssignmentConflictRaw): BatchAssignmentConflict {
  return {
    employeeId: raw.employee_id,
    code: raw.code,
    existingAssignmentId: raw.existing_assignment_id,
    message: raw.message,
  };
}

export function mapBatchResult(raw: ApiBatchAssignmentResultRaw): BatchAssignmentResult {
  return {
    createdCount: raw.created_count,
    skippedCount: raw.skipped_count,
    conflicts: (raw.conflicts ?? []).map(mapBatchConflict),
    created: (raw.created ?? []).map(mapAssignment),
  };
}

/** CamelCase payloads after `mapSingleResponse` / `mapPaginatedResponse`. */
export interface ApiCompensationTemplateRuleCamel {
  id?: string;
  routeType: string;
  commissionType: string;
  rateValue: number;
  minimumGuaranteedAmount: number;
  notes?: string | null;
  sortOrder?: number;
}

export interface ApiTemplateFixedAllowanceCamel {
  id?: string;
  allowanceType: string;
  label: string;
  amount: number;
  period: string;
  isMandatory: boolean;
}

export interface ApiRouteCorridorTariffCamel {
  id: string;
  name: string;
  originRefType: string;
  originRefValue: string;
  destinationRefType: string;
  destinationRefValue: string;
  fixedAmount: number;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCompensationTemplateCamel {
  id: string;
  tenantId?: string;
  name: string;
  description: string | null;
  isActive: boolean;
  midTripPayoutPolicy?: MidTripPayoutPolicy;
  rules: ApiCompensationTemplateRuleCamel[];
  fixedAllowances: ApiTemplateFixedAllowanceCamel[];
  corridorIds: string[];
  corridors: ApiRouteCorridorTariffCamel[];
  activeAssignmentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiTemplateAssignmentCamel {
  id: string;
  tenantId?: string;
  employeeId: string;
  employeeFullName?: string | null;
  templateId: string;
  templateName?: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  assignedBy?: string | null;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiBatchAssignmentConflictCamel {
  employeeId: string;
  code: string;
  existingAssignmentId?: string;
  message?: string;
}

export interface ApiBatchAssignmentResultCamel {
  createdCount: number;
  skippedCount: number;
  conflicts: ApiBatchAssignmentConflictCamel[];
  created: ApiTemplateAssignmentCamel[];
}

export interface ApiFixedAllowanceOverrideCamel {
  id: string;
  employeeId: string;
  allowanceId: string;
  periodStart: string;
  periodEnd: string;
  isSuspended: boolean;
  createdBy?: string | null;
  createdAt?: string;
}

export function mapTemplateRuleFromApi(
  raw: ApiCompensationTemplateRuleCamel,
): CompensationTemplateRule {
  return {
    id: raw.id,
    routeType: raw.routeType as TripRouteType,
    commissionType: raw.commissionType as AgreementCommissionType,
    rateValue: raw.rateValue,
    minimumGuaranteedAmount: raw.minimumGuaranteedAmount ?? 0,
    notes: raw.notes ?? null,
    sortOrder: raw.sortOrder,
  };
}

export function mapFixedAllowanceFromApi(
  raw: ApiTemplateFixedAllowanceCamel,
): TemplateFixedAllowance {
  return {
    id: raw.id,
    allowanceType: raw.allowanceType as FixedAllowanceType,
    label: raw.label,
    amount: raw.amount,
    period: raw.period as FixedAllowancePeriod,
    isMandatory: raw.isMandatory,
  };
}

export function mapCorridorFromApi(raw: ApiRouteCorridorTariffCamel): RouteCorridorTariff {
  return {
    id: raw.id,
    name: raw.name,
    originRefType: raw.originRefType as CorridorRefType,
    originRefValue: raw.originRefValue,
    destinationRefType: raw.destinationRefType as CorridorRefType,
    destinationRefValue: raw.destinationRefValue,
    fixedAmount: raw.fixedAmount,
    notes: raw.notes ?? null,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapTemplateFromApi(raw: ApiCompensationTemplateCamel): CompensationTemplate {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isActive: raw.isActive,
    midTripPayoutPolicy:
      raw.midTripPayoutPolicy ?? DEFAULT_MID_TRIP_PAYOUT_POLICY,
    rules: (raw.rules ?? []).map(mapTemplateRuleFromApi),
    fixedAllowances: (raw.fixedAllowances ?? []).map(mapFixedAllowanceFromApi),
    corridorIds: raw.corridorIds ?? [],
    corridors: (raw.corridors ?? []).map(mapCorridorFromApi),
    activeAssignmentsCount: raw.activeAssignmentsCount ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapAssignmentFromApi(raw: ApiTemplateAssignmentCamel): TemplateAssignment {
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    employeeFullName: raw.employeeFullName ?? null,
    templateId: raw.templateId,
    templateName: raw.templateName ?? null,
    effectiveFrom: raw.effectiveFrom,
    effectiveTo: raw.effectiveTo,
    isActive: raw.isActive,
    assignedBy: raw.assignedBy ?? null,
    reason: raw.reason ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function mapFixedAllowanceOverrideFromApi(
  raw: ApiFixedAllowanceOverrideCamel,
): FixedAllowanceOverride {
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    allowanceId: raw.allowanceId,
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
    isSuspended: raw.isSuspended,
    createdBy: raw.createdBy ?? null,
    createdAt: raw.createdAt,
  };
}

export function mapBatchConflictFromApi(
  raw: ApiBatchAssignmentConflictCamel,
): BatchAssignmentConflict {
  return {
    employeeId: raw.employeeId,
    code: raw.code,
    existingAssignmentId: raw.existingAssignmentId,
    message: raw.message,
  };
}

export function mapBatchResultFromApi(raw: ApiBatchAssignmentResultCamel): BatchAssignmentResult {
  return {
    createdCount: raw.createdCount,
    skippedCount: raw.skippedCount,
    conflicts: (raw.conflicts ?? []).map(mapBatchConflictFromApi),
    created: (raw.created ?? []).map(mapAssignmentFromApi),
  };
}

/** Helper for tests — accepts already camelized API payloads. */
export function mapTemplateFromUnknown(raw: unknown): CompensationTemplate {
  return mapTemplate(deepToCamel(raw) as ApiCompensationTemplateRaw);
}

export function mapCorridorFromUnknown(raw: unknown): RouteCorridorTariff {
  return mapCorridor(deepToCamel(raw) as ApiRouteCorridorTariffRaw);
}
