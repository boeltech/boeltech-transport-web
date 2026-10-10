import { deepToCamel } from "@shared/api";
import type {
  AgreementCommissionType,
  MidTripPayoutPolicy,
  TripRouteType,
} from "@features/settlements";
import { DEFAULT_MID_TRIP_PAYOUT_POLICY } from "@features/settlements/domain/enums";
import {
  BATCH_ASSIGNMENT_CONFLICT_REASONS,
  type AssignmentBlockingSettlementStatus,
  type BatchAssignmentConflictReason,
  type CorridorRefType,
  type CompensationTemplateEventAction,
  type CompensationTemplateInactiveReason,
  type CompensationTemplateLockedReason,
  type CompensationTemplateStatus,
  type FixedAllowancePeriod,
  type FixedAllowanceType,
  type TemplateDeductionType,
} from "../domain/enums";
import type {
  AssignmentBlockingSettlement,
  BatchAssignmentConflict,
  BatchAssignmentPlannedClosure,
  BatchAssignmentPreview,
  BatchAssignmentResult,
  CompensationTemplate,
  CompensationTemplateEvent,
  CompensationTemplateFamilySummary,
  CompensationTemplateRule,
  CompensationTemplateVersionRef,
  FixedAllowanceOverride,
  FrequentCityPair,
  RouteCorridorTariff,
  TemplateAssignment,
  TemplateDeduction,
  TemplateFixedAllowance,
} from "../domain/entities";

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

export interface ApiTemplateDeductionRaw {
  id?: string;
  deduction_type: string;
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

export interface ApiFrequentCityPairRaw {
  origin_city: string;
  destination_city: string;
  origin_state: string | null;
  destination_state: string | null;
  trip_count: number;
  last_used_at: string;
}

export interface ApiCompensationTemplateRaw {
  id: string;
  tenant_id?: string;
  name: string;
  description: string | null;
  is_active: boolean;
  status?: string;
  version?: number;
  family_id?: string;
  supersedes_template_id?: string | null;
  locked_for_edit?: boolean;
  locked_reason?: string | null;
  inactive_reason?: string | null;
  superseded_by_template_id?: string | null;
  inactivated_at?: string | null;
  mid_trip_payout_policy?: string;
  rules: ApiCompensationTemplateRuleRaw[];
  fixed_allowances: ApiTemplateFixedAllowanceRaw[];
  deductions?: ApiTemplateDeductionRaw[];
  corridor_ids: string[];
  corridors: ApiRouteCorridorTariffRaw[];
  active_assignments_count?: number;
  scheduled_assignments_count?: number;
  family?: ApiCompensationTemplateFamilySummaryRaw;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCompensationTemplateVersionRef {
  id: string;
  version: number;
}

export interface ApiCompensationTemplateFamilySummaryRaw {
  versions_count: number;
  active_version: ApiCompensationTemplateVersionRef | null;
  draft_version: ApiCompensationTemplateVersionRef | null;
  superseded_active_assignments_count?: number;
  superseded_scheduled_assignments_count?: number;
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
  is_used_in_settlement?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiAssignmentBlockingSettlementRaw {
  settlement_id: string;
  settlement_number: string;
  status: string;
  period_start: string;
  period_end: string;
}

export interface ApiBatchAssignmentConflictRaw {
  employee_id: string;
  code: string;
  message?: string;
  reason?: string;
  employee_full_name?: string | null;
  existing_assignment_id?: string | null;
  existing_template_id?: string | null;
  existing_template_name?: string | null;
  existing_template_version?: number | null;
  existing_effective_from?: string | null;
  existing_effective_to?: string | null;
  close_previous_on?: string | null;
  suggested_effective_from?: string | null;
  blocking_settlements?: ApiAssignmentBlockingSettlementRaw[];
  blocking_settlements_total?: number;
  min_effective_to?: string | null;
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

export function mapDeduction(raw: ApiTemplateDeductionRaw): TemplateDeduction {
  return {
    id: raw.id,
    deductionType: raw.deduction_type as TemplateDeductionType,
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

export function mapFrequentCityPair(raw: ApiFrequentCityPairRaw): FrequentCityPair {
  return {
    originCity: raw.origin_city,
    destinationCity: raw.destination_city,
    originState: raw.origin_state ?? null,
    destinationState: raw.destination_state ?? null,
    tripCount: raw.trip_count,
    lastUsedAt: raw.last_used_at,
  };
}

function resolveTemplateStatus(
  status: string | undefined,
  isActive: boolean,
): CompensationTemplateStatus {
  if (status === "draft" || status === "active" || status === "inactive") {
    return status;
  }
  return isActive ? "active" : "inactive";
}

/** Un valor desconocido se trata como ausente para no inventar un estado. */
function resolveInactiveReason(
  value: string | null | undefined,
): CompensationTemplateInactiveReason | null | undefined {
  if (value === "superseded" || value === "manual") return value;
  if (value === null) return null;
  return undefined;
}

function resolveLockedReason(
  value: string | null | undefined,
): CompensationTemplateLockedReason | null | undefined {
  if (value === "superseded" || value === "used_in_settlements") return value;
  if (value === null) return null;
  return undefined;
}

type TemplateVersionLifecycleFields = Pick<
  CompensationTemplate,
  "lockedReason" | "inactiveReason" | "supersededByTemplateId" | "inactivatedAt"
>;

/** Solo incluye las claves que la API envió (conserva `undefined` vs `null`). */
function mapVersionLifecycleFields(fields: {
  lockedReason: string | null | undefined;
  inactiveReason: string | null | undefined;
  supersededByTemplateId: string | null | undefined;
  inactivatedAt: string | null | undefined;
}): TemplateVersionLifecycleFields {
  const lockedReason = resolveLockedReason(fields.lockedReason);
  const inactiveReason = resolveInactiveReason(fields.inactiveReason);
  return {
    ...(lockedReason !== undefined ? { lockedReason } : {}),
    ...(inactiveReason !== undefined ? { inactiveReason } : {}),
    ...(fields.supersededByTemplateId !== undefined
      ? { supersededByTemplateId: fields.supersededByTemplateId }
      : {}),
    ...(fields.inactivatedAt !== undefined ? { inactivatedAt: fields.inactivatedAt } : {}),
  };
}

function mapVersionRef(
  raw: ApiCompensationTemplateVersionRef | null | undefined,
): CompensationTemplateVersionRef | null {
  return raw ? { id: raw.id, version: Number(raw.version) } : null;
}

export function mapFamilySummary(
  raw: ApiCompensationTemplateFamilySummaryRaw,
): CompensationTemplateFamilySummary {
  return mapFamilySummaryFromApi(deepToCamel(raw) as ApiCompensationTemplateFamilySummaryCamel);
}

export function mapTemplate(raw: ApiCompensationTemplateRaw): CompensationTemplate {
  const status = resolveTemplateStatus(raw.status, raw.is_active);
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isActive: status === "active",
    status,
    version: Number(raw.version ?? 1),
    familyId: raw.family_id ?? raw.id,
    supersedesTemplateId: raw.supersedes_template_id ?? null,
    lockedForEdit: Boolean(raw.locked_for_edit),
    ...mapVersionLifecycleFields({
      lockedReason: raw.locked_reason,
      inactiveReason: raw.inactive_reason,
      supersededByTemplateId: raw.superseded_by_template_id,
      inactivatedAt: raw.inactivated_at,
    }),
    midTripPayoutPolicy:
      (raw.mid_trip_payout_policy as MidTripPayoutPolicy | undefined) ??
      DEFAULT_MID_TRIP_PAYOUT_POLICY,
    rules: (raw.rules ?? []).map(mapTemplateRule),
    fixedAllowances: (raw.fixed_allowances ?? []).map(mapFixedAllowance),
    deductions: (raw.deductions ?? []).map(mapDeduction),
    corridorIds: raw.corridor_ids ?? [],
    corridors: (raw.corridors ?? []).map(mapCorridor),
    activeAssignmentsCount: raw.active_assignments_count ?? 0,
    scheduledAssignmentsCount: raw.scheduled_assignments_count,
    ...(raw.family ? { family: mapFamilySummary(raw.family) } : {}),
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
    isUsedInSettlement: raw.is_used_in_settlement,
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
  return mapBatchConflictFromApi(deepToCamel(raw) as ApiBatchAssignmentConflictCamel);
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

export interface ApiTemplateDeductionCamel {
  id?: string;
  deductionType: string;
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

export interface ApiFrequentCityPairCamel {
  originCity: string;
  destinationCity: string;
  originState: string | null;
  destinationState: string | null;
  tripCount: number;
  lastUsedAt: string;
}

export interface ApiCompensationTemplateCamel {
  id: string;
  tenantId?: string;
  name: string;
  description: string | null;
  isActive: boolean;
  status?: CompensationTemplateStatus | string;
  version?: number;
  familyId?: string;
  supersedesTemplateId?: string | null;
  lockedForEdit?: boolean;
  lockedReason?: string | null;
  inactiveReason?: string | null;
  supersededByTemplateId?: string | null;
  inactivatedAt?: string | null;
  midTripPayoutPolicy?: MidTripPayoutPolicy;
  rules: ApiCompensationTemplateRuleCamel[];
  fixedAllowances: ApiTemplateFixedAllowanceCamel[];
  deductions?: ApiTemplateDeductionCamel[];
  corridorIds: string[];
  corridors: ApiRouteCorridorTariffCamel[];
  activeAssignmentsCount?: number;
  scheduledAssignmentsCount?: number;
  family?: ApiCompensationTemplateFamilySummaryCamel;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiCompensationTemplateFamilySummaryCamel {
  versionsCount: number;
  activeVersion: ApiCompensationTemplateVersionRef | null;
  draftVersion: ApiCompensationTemplateVersionRef | null;
  supersededActiveAssignmentsCount?: number;
  supersededScheduledAssignmentsCount?: number;
}

export interface ApiCompensationTemplateEventCamel {
  id: string;
  tenantId?: string;
  templateId: string;
  familyId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorFirstName?: string | null;
  actorLastName?: string | null;
  action: string;
  payload?: Record<string, unknown>;
  createdAt: string;
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
  isUsedInSettlement?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiAssignmentBlockingSettlementCamel {
  settlementId: string;
  settlementNumber: string;
  status: string;
  periodStart: string;
  periodEnd: string;
}

export interface ApiBatchAssignmentConflictCamel {
  employeeId: string;
  code: string;
  message?: string;
  reason?: string;
  employeeFullName?: string | null;
  existingAssignmentId?: string | null;
  existingTemplateId?: string | null;
  existingTemplateName?: string | null;
  existingTemplateVersion?: number | null;
  existingEffectiveFrom?: string | null;
  existingEffectiveTo?: string | null;
  closePreviousOn?: string | null;
  suggestedEffectiveFrom?: string | null;
  blockingSettlements?: ApiAssignmentBlockingSettlementCamel[];
  blockingSettlementsTotal?: number;
  minEffectiveTo?: string | null;
}

export interface ApiBatchAssignmentResultCamel {
  createdCount: number;
  skippedCount: number;
  conflicts: ApiBatchAssignmentConflictCamel[];
  created: ApiTemplateAssignmentCamel[];
}

export interface ApiBatchAssignmentPlannedClosureCamel {
  employeeId: string;
  employeeFullName?: string | null;
  assignmentId: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  closeTo: string;
}

export interface ApiBatchAssignmentPreviewEmployeeCamel {
  employeeId: string;
  employeeFullName?: string | null;
  outcome: string;
}

export interface ApiBatchAssignmentPreviewCamel {
  wouldCreateCount: number;
  wouldSkipCount: number;
  employees?: ApiBatchAssignmentPreviewEmployeeCamel[];
  conflicts?: ApiBatchAssignmentConflictCamel[];
  closures?: ApiBatchAssignmentPlannedClosureCamel[];
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

export function mapDeductionFromApi(raw: ApiTemplateDeductionCamel): TemplateDeduction {
  return {
    id: raw.id,
    deductionType: raw.deductionType as TemplateDeductionType,
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

export function mapFrequentCityPairFromApi(
  raw: ApiFrequentCityPairCamel,
): FrequentCityPair {
  return {
    originCity: raw.originCity,
    destinationCity: raw.destinationCity,
    originState: raw.originState ?? null,
    destinationState: raw.destinationState ?? null,
    tripCount: raw.tripCount,
    lastUsedAt: raw.lastUsedAt,
  };
}

export function mapTemplateFromApi(raw: ApiCompensationTemplateCamel): CompensationTemplate {
  const status = resolveTemplateStatus(
    typeof raw.status === "string" ? raw.status : undefined,
    raw.isActive,
  );
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isActive: status === "active",
    status,
    version: Number(raw.version ?? 1),
    familyId: raw.familyId ?? raw.id,
    supersedesTemplateId: raw.supersedesTemplateId ?? null,
    lockedForEdit: Boolean(raw.lockedForEdit),
    ...mapVersionLifecycleFields({
      lockedReason: raw.lockedReason,
      inactiveReason: raw.inactiveReason,
      supersededByTemplateId: raw.supersededByTemplateId,
      inactivatedAt: raw.inactivatedAt,
    }),
    midTripPayoutPolicy:
      raw.midTripPayoutPolicy ?? DEFAULT_MID_TRIP_PAYOUT_POLICY,
    rules: (raw.rules ?? []).map(mapTemplateRuleFromApi),
    fixedAllowances: (raw.fixedAllowances ?? []).map(mapFixedAllowanceFromApi),
    deductions: (raw.deductions ?? []).map(mapDeductionFromApi),
    corridorIds: raw.corridorIds ?? [],
    corridors: (raw.corridors ?? []).map(mapCorridorFromApi),
    activeAssignmentsCount: raw.activeAssignmentsCount ?? 0,
    scheduledAssignmentsCount: raw.scheduledAssignmentsCount,
    ...(raw.family ? { family: mapFamilySummaryFromApi(raw.family) } : {}),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Conteos de reemplazadas ausentes cuentan como 0 (sin aviso de operadores en reemplazadas). */
export function mapFamilySummaryFromApi(
  raw: ApiCompensationTemplateFamilySummaryCamel,
): CompensationTemplateFamilySummary {
  return {
    versionsCount: Number(raw.versionsCount ?? 1),
    activeVersion: mapVersionRef(raw.activeVersion),
    draftVersion: mapVersionRef(raw.draftVersion),
    supersededActiveAssignmentsCount: Number(raw.supersededActiveAssignmentsCount ?? 0),
    supersededScheduledAssignmentsCount: Number(raw.supersededScheduledAssignmentsCount ?? 0),
  };
}

export function mapTemplateEventFromApi(
  raw: ApiCompensationTemplateEventCamel,
): CompensationTemplateEvent {
  return {
    id: raw.id,
    templateId: raw.templateId,
    familyId: raw.familyId,
    actorUserId: raw.actorUserId ?? null,
    actorEmail: raw.actorEmail ?? null,
    actorFirstName: raw.actorFirstName ?? null,
    actorLastName: raw.actorLastName ?? null,
    action: raw.action as CompensationTemplateEventAction,
    payload: raw.payload ?? {},
    createdAt: raw.createdAt,
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
    isUsedInSettlement: raw.isUsedInSettlement,
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

/** Un motivo desconocido se trata como ausente: la web cae al mensaje de la API. */
function resolveBatchConflictReason(
  value: string | undefined,
): BatchAssignmentConflictReason | undefined {
  return BATCH_ASSIGNMENT_CONFLICT_REASONS.find((reason) => reason === value);
}

export function mapBlockingSettlementFromApi(
  raw: ApiAssignmentBlockingSettlementCamel,
): AssignmentBlockingSettlement {
  return {
    settlementId: raw.settlementId,
    settlementNumber: raw.settlementNumber,
    status: raw.status as AssignmentBlockingSettlementStatus,
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
  };
}

export function mapBatchConflictFromApi(
  raw: ApiBatchAssignmentConflictCamel,
): BatchAssignmentConflict {
  return {
    employeeId: raw.employeeId,
    code: raw.code,
    message: raw.message,
    reason: resolveBatchConflictReason(raw.reason),
    employeeFullName: raw.employeeFullName,
    existingAssignmentId: raw.existingAssignmentId,
    existingTemplateId: raw.existingTemplateId,
    existingTemplateName: raw.existingTemplateName,
    existingTemplateVersion: raw.existingTemplateVersion,
    existingEffectiveFrom: raw.existingEffectiveFrom,
    existingEffectiveTo: raw.existingEffectiveTo,
    closePreviousOn: raw.closePreviousOn,
    suggestedEffectiveFrom: raw.suggestedEffectiveFrom,
    blockingSettlements: raw.blockingSettlements?.map(mapBlockingSettlementFromApi),
    blockingSettlementsTotal: raw.blockingSettlementsTotal,
    minEffectiveTo: raw.minEffectiveTo,
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

export function mapPlannedClosureFromApi(
  raw: ApiBatchAssignmentPlannedClosureCamel,
): BatchAssignmentPlannedClosure {
  return {
    employeeId: raw.employeeId,
    employeeFullName: raw.employeeFullName ?? null,
    assignmentId: raw.assignmentId,
    templateId: raw.templateId,
    templateName: raw.templateName,
    templateVersion: raw.templateVersion,
    effectiveFrom: raw.effectiveFrom,
    effectiveTo: raw.effectiveTo ?? null,
    closeTo: raw.closeTo,
  };
}

export function mapBatchPreviewFromApi(
  raw: ApiBatchAssignmentPreviewCamel,
): BatchAssignmentPreview {
  return {
    wouldCreateCount: raw.wouldCreateCount,
    wouldSkipCount: raw.wouldSkipCount,
    employees: (raw.employees ?? []).map((employee) => ({
      employeeId: employee.employeeId,
      employeeFullName: employee.employeeFullName ?? null,
      outcome: employee.outcome === "skip" ? "skip" : "create",
    })),
    conflicts: (raw.conflicts ?? []).map(mapBatchConflictFromApi),
    closures: (raw.closures ?? []).map(mapPlannedClosureFromApi),
  };
}

/** Helper for tests — accepts already camelized API payloads. */
export function mapTemplateFromUnknown(raw: unknown): CompensationTemplate {
  return mapTemplate(deepToCamel(raw) as ApiCompensationTemplateRaw);
}

export function mapCorridorFromUnknown(raw: unknown): RouteCorridorTariff {
  return mapCorridor(deepToCamel(raw) as ApiRouteCorridorTariffRaw);
}
