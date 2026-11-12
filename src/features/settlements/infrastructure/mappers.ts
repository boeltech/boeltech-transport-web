import { deepToCamel } from "@shared/api";
import type { MappedPaginatedResult } from "@shared/api";
import { mapApprovalBlock, type ApiApprovalBlockRaw } from "@features/approvals/infrastructure";
import type {
  CommissionCalculationGap,
  CompensationAgreement,
  CompensationAgreementRule,
  DriverAdvance,
  DriverSettlement,
  EligibleTripPreview,
  LateReimbursementsSummary,
  OpenAdvancePreview,
  OperatorPaymentReadiness,
  PeriodicBlockPreview,
  ReimbursementPreviewLine,
  ReimbursementRequiringPayeeLine,
  SettlementItem,
  SettlementPreview,
  SettlementBacklogRow,
  SettlementPeriodOverlap,
  SettlementPeriodOverlapStatus,
  AdvancePeriodDeductionPlan,
  SettlementWorkbenchData,
  SettlementTemplateChange,
  SettlementTemplateSuperseded,
  SettlementWorkbenchSummary,
  SettlementsNavBadges,
  TemplatePeriodAssignmentRef,
  TemplateVersionReplacementRef,
  TenantSettlementSettings,
  WorkbenchKpiBucket,
  ZeroCommissionReason,
} from "../domain/entities";
import type {
  SettlementCutCreateResult,
  SettlementCutCreatedRow,
  SettlementCutEffect,
  SettlementCutOmittedRow,
  SettlementCutPreview,
  SettlementCutPreviewRow,
  SettlementCutPreviewSummary,
  SettlementCutSalaryPeriod,
  SettlementCutWarning,
  SettlementCutWarningCode,
} from "../domain/settlementCut";
import type {
  SettlementBatchActionResult,
  SettlementBatchOmittedRow,
  SettlementBatchProcessedRow,
  SettlementBatchReasonCode,
} from "../domain/settlementBatch";
import {
  DEFAULT_VOBO_THRESHOLD_MXN,
  normalizeMidTripPayoutPolicy,
  type CompensationSalaryPeriod,
  type OperatorPaymentAttentionReason,
  type OperatorPaymentReadinessStatus,
  type OperatorTemplatePayability,
} from "../domain/enums";

export interface ApiCompensationAgreementRuleRaw {
  id?: string;
  agreement_id?: string;
  route_type: string;
  commission_type: string;
  rate_value: number;
  minimum_guaranteed_amount?: number;
  notes?: string | null;
}

export interface ApiCompensationAgreementRaw {
  id: string;
  tenant_id: string;
  employee_id: string;
  employee_full_name?: string;
  has_fixed_salary?: boolean;
  fixed_salary_amount?: number;
  fixed_salary_period?: string;
  is_salary_guaranteed?: boolean;
  rules?: ApiCompensationAgreementRuleRaw[];
  calculation_type?: string;
  base_rate?: number;
  rate_per_km?: number;
  percentage_rate?: number;
  helper_daily_rate?: number;
  currency: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  notes: string | null;
  mid_trip_payout_policy?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiDriverAdvanceRaw {
  id: string;
  tenant_id: string;
  folio: string;
  employee_id: string;
  employee_full_name?: string;
  trip_id: string | null;
  trip_code?: string;
  amount: number;
  balance_remaining: number;
  reserved_amount?: number;
  available_balance?: number;
  currency: string;
  category: string;
  status: string;
  disbursed_at: string | null;
  payment_method: string;
  authorized_payment_method?: string | null;
  bank_reference: string | null;
  submitted_at?: string | null;
  submitted_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  notes: string | null;
  created_by?: string | null;
  disbursed_by?: string | null;
  self_segregated_approval?: boolean | null;
  approver_count_at_approve?: number | null;
  self_segregated_disbursement?: boolean | null;
  executor_count_at_disburse?: number | null;
  approval_revision?: string | null;
  approval?: ApiApprovalBlockRaw | null;
  period_deduction_cap?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApiSettlementItemRaw {
  id: string;
  settlement_id: string;
  item_type: string;
  trip_id: string | null;
  trip_code?: string;
  trip_expense_id: string | null;
  advance_id: string | null;
  description: string;
  quantity: number;
  unit_rate: number;
  amount: number;
  is_deduction: boolean;
  calculation_details?: Record<string, unknown>;
  created_at: string;
}

export interface ApiDriverSettlementRaw {
  id: string;
  tenant_id: string;
  settlement_number: string;
  employee_id: string;
  employee_full_name?: string;
  agreement_snapshot: Record<string, unknown>;
  /** C19: nombre+versión de la tarifa del pago (GET detalle). */
  template_snapshot?: Record<string, unknown> | null;
  period_start: string;
  period_end: string;
  status: string;
  total_trips_commission: number;
  total_base_salary: number;
  total_reimbursable_expenses: number;
  total_bonuses: number;
  total_advances_deducted: number;
  total_other_deductions: number;
  gross_amount: number;
  net_amount: number;
  uncovered_deductions_amount?: number;
  currency: string;
  disbursed_at: string | null;
  disbursed_by: string | null;
  disbursed_by_name?: string;
  disbursement_method: string | null;
  disbursement_reference: string | null;
  approved_at: string | null;
  approved_by: string | null;
  approved_by_name?: string;
  submitted_at?: string | null;
  submitted_by?: string | null;
  submitted_by_name?: string | null;
  rejection_reason: string | null;
  notes: string | null;
  trips_count?: number;
  created_at: string;
  updated_at: string;
  items?: ApiSettlementItemRaw[];
  has_manual_adjustments?: boolean;
  vobo_required?: boolean;
  advances_reserved?: boolean;
  advances_applied?: boolean;
  self_segregated_approval?: boolean;
  approver_count_at_approve?: number | null;
  self_segregated_disbursement?: boolean;
  executor_count_at_disburse?: number | null;
  advances_deducted_at_create?: boolean;
  approval_revision?: string | null;
  approval?: ApiApprovalBlockRaw | null;
  created_by?: string | null;
  created_by_name?: string | null;
  settlement_kind?: string;
  late_reimbursements?: ApiLateReimbursementsRaw | null;
}

export interface ApiTripSettledInRaw {
  settlement_id: string;
  settlement_number: string;
}

export interface ApiLateReimbursementsRaw {
  count: number;
  amount: number;
  trip_expense_ids?: string[];
  trip_ids?: string[];
  reference: string;
  items?: Array<{
    trip_expense_id: string;
    trip_id: string;
    trip_code: string;
    description: string;
    amount: number;
    approved_at: string | null;
  }>;
}

export interface ApiReimbursementPreviewLineRaw {
  trip_expense_id: string;
  trip_id: string;
  trip_code: string;
  category: string;
  description: string;
  amount: number;
  receipt_number?: string | null;
  approved_at: string | null;
  is_late?: boolean;
  trip_settled_in?: ApiTripSettledInRaw | null;
}

export interface ApiReimbursementRequiringPayeeLineRaw {
  trip_expense_id: string;
  trip_id: string;
  trip_code: string;
  category: string;
  description: string;
  amount: number;
  approved_at: string | null;
  reason?: string;
  trip_settled_in?: ApiTripSettledInRaw | null;
}

export interface ApiTemplatePeriodAssignmentRefRaw {
  assignment_id: string;
  template_id: string;
  template_name: string;
  template_version: number;
  effective_from: string;
  effective_to: string | null;
  is_closing: boolean;
}

export interface ApiTemplateChangeInPeriodRaw {
  templates_count: number;
  from: ApiTemplatePeriodAssignmentRefRaw;
  to: ApiTemplatePeriodAssignmentRefRaw;
  assignments: ApiTemplatePeriodAssignmentRefRaw[];
}

export interface ApiTemplateVersionSupersededRaw {
  template_id: string;
  template_name: string;
  template_version: number;
  assignment_id: string;
  superseded_at?: string | null;
  replaced_by?: {
    template_id: string;
    template_name: string;
    template_version: number;
  } | null;
}

export interface ApiSettlementPreviewRaw {
  employee_id: string;
  employee_name: string;
  settlement_kind?: string;
  reimbursements?: ApiReimbursementPreviewLineRaw[];
  reimbursements_requiring_payee?: ApiReimbursementRequiringPayeeLineRaw[];
  period_start: string;
  period_end: string;
  agreement: Record<string, unknown>;
  template?: {
    id: string;
    name: string;
    assignment_id: string;
    /** api#59 F3. Ausente en el API anterior. */
    version?: number;
    payability?: string;
  };
  /** D-1 C1 (API F5). Ausente en el API anterior. */
  template_change?: ApiTemplateChangeInPeriodRaw | null;
  /** api#59 F3. Ausente en el API anterior. */
  template_superseded?: ApiTemplateVersionSupersededRaw | null;
  employee_compensation?: {
    base_salary: number;
    salary_type: string | null;
  };
  fixed_allowances?: Array<{
    id: string;
    label: string;
    amount: number;
    suspended: boolean;
  }>;
  deductions?: Array<{
    id: string;
    deduction_type: string;
    label: string;
    amount: number;
    is_mandatory: boolean;
    requested_amount?: number;
    applied_amount?: number;
    omitted_amount?: number;
  }>;
  eligible_trips: Array<{
    trip_id: string;
    trip_code: string;
    route_type?: string;
    scheduled_departure: string;
    completed_at: string | null;
    origin_city: string;
    destination_city: string;
    distance_km: number;
    freight_revenue: number;
    applied_rule?: string | null;
    calculated_commission: number;
    approved_reimbursable_expenses: number;
    corridor_match?: {
      corridor_id: string;
      name: string;
      fixed_amount: number;
      replaces_km_commission: boolean;
    };
    freight_base?: "commercial_at_complete" | "live_base_rate";
    mid_trip_share_ratio?: number;
    participant_count?: number;
    operational_outcome?: "standard" | "false_trip";
    has_revenue_split?: boolean;
    distance_basis?: "executed_stops" | "odometer" | "unavailable";
    requires_zero_km_ack?: boolean;
    requires_zero_freight_ack?: boolean;
    zero_commission_reason?: ZeroCommissionReason | null;
    commission_before_minimum?: number | null;
    minimum_guaranteed_amount?: number | null;
    minimum_guaranteed_applied?: boolean;
    calculation_gap?: CommissionCalculationGap | null;
  }>;
  periodic_block?: {
    status: PeriodicBlockPreview["status"];
    settlement: {
      settlement_id: string;
      settlement_number: string;
      status: string;
      period_start: string;
      period_end: string;
    } | null;
    suggested_period_start: string | null;
  };
  open_advances: Array<{
    advance_id: string;
    folio: string;
    amount: number;
    balance_remaining: number;
    reserved_amount?: number;
    available_balance?: number;
    reserved_by_settlement_number?: string | null;
    category: string;
    disbursed_at: string | null;
  }>;
  summary: {
    total_commissions: number;
    total_base_salary: number;
    total_fixed_allowances?: number;
    total_reimbursements: number;
    total_deductions?: number;
    total_deductions_omitted?: number;
    suggested_advance_deduction: number;
    gross_amount: number;
    net_amount: number;
  };
}

export interface ApiTenantSettlementSettingsRaw {
  vobo_threshold_mxn: number | null;
  active_approver_count: number;
  active_executor_count: number;
}

export interface ApiPaginationRaw {
  page: number;
  limit?: number;
  page_size?: number;
  pageSize?: number;
  total: number;
  total_pages?: number;
  totalPages?: number;
}

function extractPagination(raw: ApiPaginationRaw | undefined, defaultPage = 1, defaultLimit = 20) {
  if (!raw) {
    return {
      page: defaultPage,
      limit: defaultLimit,
      total: 0,
      totalPages: 1,
    };
  }
  const page = Number(raw.page) || defaultPage;
  const limit = Number(raw.limit ?? raw.page_size ?? raw.pageSize) || defaultLimit;
  const total = Number(raw.total) || 0;
  const totalPages =
    Number(raw.total_pages ?? raw.totalPages) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return {
    page,
    limit,
    total,
    totalPages,
  };
}

export function mapAgreementRule(raw: ApiCompensationAgreementRuleRaw): CompensationAgreementRule {
  return {
    id: raw.id,
    agreementId: raw.agreement_id,
    routeType: raw.route_type as CompensationAgreementRule["routeType"],
    commissionType: raw.commission_type as CompensationAgreementRule["commissionType"],
    rateValue: Number(raw.rate_value) || 0,
    minimumGuaranteedAmount:
      raw.minimum_guaranteed_amount !== undefined
        ? Number(raw.minimum_guaranteed_amount)
        : undefined,
    notes: raw.notes ?? null,
  };
}

export function mapAgreement(raw: ApiCompensationAgreementRaw): CompensationAgreement {
  const rules = raw.rules ? raw.rules.map(mapAgreementRule) : [];
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    employeeId: raw.employee_id,
    employeeFullName: raw.employee_full_name,
    hasFixedSalary: raw.has_fixed_salary,
    fixedSalaryAmount:
      raw.fixed_salary_amount !== undefined ? Number(raw.fixed_salary_amount) : undefined,
    fixedSalaryPeriod: raw.fixed_salary_period as CompensationAgreement["fixedSalaryPeriod"],
    isSalaryGuaranteed: raw.is_salary_guaranteed,
    rules,
    calculationType: raw.calculation_type as CompensationAgreement["calculationType"],
    baseRate: raw.base_rate !== undefined ? Number(raw.base_rate) : undefined,
    ratePerKm: raw.rate_per_km !== undefined ? Number(raw.rate_per_km) : undefined,
    percentageRate: raw.percentage_rate !== undefined ? Number(raw.percentage_rate) : undefined,
    helperDailyRate: raw.helper_daily_rate !== undefined ? Number(raw.helper_daily_rate) : undefined,
    currency: raw.currency,
    effectiveFrom: raw.effective_from,
    effectiveTo: raw.effective_to,
    isActive: Boolean(raw.is_active),
    notes: raw.notes ?? null,
    midTripPayoutPolicy: normalizeMidTripPayoutPolicy(raw.mid_trip_payout_policy),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function mapAdvance(raw: ApiDriverAdvanceRaw): DriverAdvance {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    folio: raw.folio,
    employeeId: raw.employee_id,
    employeeFullName: raw.employee_full_name,
    tripId: raw.trip_id,
    tripCode: raw.trip_code ?? null,
    amount: Number(raw.amount),
    balanceRemaining: Number(raw.balance_remaining),
    reservedAmount:
      raw.reserved_amount !== undefined ? Number(raw.reserved_amount) : undefined,
    availableBalance:
      raw.available_balance !== undefined ? Number(raw.available_balance) : undefined,
    currency: raw.currency,
    category: raw.category as DriverAdvance["category"],
    status: raw.status as DriverAdvance["status"],
    disbursedAt: raw.disbursed_at,
    paymentMethod: raw.payment_method as DriverAdvance["paymentMethod"],
    authorizedPaymentMethod: raw.authorized_payment_method
      ? (raw.authorized_payment_method as DriverAdvance["paymentMethod"])
      : undefined,
    bankReference: raw.bank_reference,
    submittedAt: raw.submitted_at ?? null,
    submittedBy: raw.submitted_by ?? null,
    approvedAt: raw.approved_at ?? null,
    approvedBy: raw.approved_by ?? null,
    rejectedAt: raw.rejected_at ?? null,
    rejectedBy: raw.rejected_by ?? null,
    rejectionReason: raw.rejection_reason ?? null,
    notes: raw.notes ?? null,
    createdBy: raw.created_by ?? null,
    disbursedBy: raw.disbursed_by ?? null,
    selfSegregatedApproval: Boolean(raw.self_segregated_approval),
    approverCountAtApprove:
      raw.approver_count_at_approve === undefined || raw.approver_count_at_approve === null
        ? null
        : Number(raw.approver_count_at_approve),
    selfSegregatedDisbursement: Boolean(raw.self_segregated_disbursement),
    executorCountAtDisburse:
      raw.executor_count_at_disburse === undefined || raw.executor_count_at_disburse === null
        ? null
        : Number(raw.executor_count_at_disburse),
    ...(raw.approval_revision !== undefined
      ? { approvalRevision: raw.approval_revision }
      : {}),
    ...(raw.approval !== undefined
      ? { approval: raw.approval ? mapApprovalBlock(raw.approval) : null }
      : {}),
    periodDeductionCap:
      raw.period_deduction_cap === undefined
        ? undefined
        : raw.period_deduction_cap === null
          ? null
          : Number(raw.period_deduction_cap),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

const optionalNumber = (value: unknown): number | undefined =>
  value === undefined || value === null ? undefined : Number(value);

const nullableNumber = (value: unknown): number | null =>
  value === undefined || value === null ? null : Number(value);

function mapCalculationGap(value: unknown): CommissionCalculationGap | null {
  return value === "zero_km" || value === "zero_freight" ? value : null;
}

function mapCalculationDetails(
  raw: Record<string, unknown>,
): SettlementItem["calculationDetails"] {
  const details = deepToCamel(raw) as Record<string, unknown>;
  const requestedAmount = optionalNumber(raw.requested_amount);
  const omittedAmount = optionalNumber(raw.omitted_amount);
  return {
    ...details,
    ...(requestedAmount !== undefined ? { requestedAmount } : {}),
    ...(omittedAmount !== undefined ? { omittedAmount } : {}),
    ...("commission_before_minimum" in raw
      ? { commissionBeforeMinimum: nullableNumber(raw.commission_before_minimum) }
      : {}),
    ...("minimum_guaranteed_amount" in raw
      ? { minimumGuaranteedAmount: nullableNumber(raw.minimum_guaranteed_amount) }
      : {}),
    ...("minimum_guaranteed_applied" in raw
      ? { minimumGuaranteedApplied: raw.minimum_guaranteed_applied === true }
      : {}),
    ...("calculation_gap" in raw
      ? { calculationGap: mapCalculationGap(raw.calculation_gap) }
      : {}),
  } as SettlementItem["calculationDetails"];
}

export function mapSettlementItem(raw: ApiSettlementItemRaw): SettlementItem {
  return {
    id: raw.id,
    settlementId: raw.settlement_id,
    itemType: raw.item_type as SettlementItem["itemType"],
    tripId: raw.trip_id,
    tripCode: raw.trip_code ?? null,
    tripExpenseId: raw.trip_expense_id,
    advanceId: raw.advance_id,
    description: raw.description,
    quantity: Number(raw.quantity),
    unitRate: Number(raw.unit_rate),
    amount: Number(raw.amount),
    isDeduction: Boolean(raw.is_deduction),
    calculationDetails: raw.calculation_details
      ? mapCalculationDetails(raw.calculation_details)
      : null,
    createdAt: raw.created_at,
  };
}

function mapSettlementKind(raw: string | undefined): DriverSettlement["settlementKind"] {
  return raw === "reimbursement_only" ? "reimbursement_only" : "regular";
}

function mapTripSettledIn(
  raw: ApiTripSettledInRaw | null | undefined,
): ReimbursementPreviewLine["tripSettledIn"] {
  if (!raw?.settlement_id) return null;
  return { settlementId: raw.settlement_id, settlementNumber: raw.settlement_number ?? "" };
}

export function mapLateReimbursements(
  raw: ApiLateReimbursementsRaw | null | undefined,
): LateReimbursementsSummary | null {
  if (!raw) return null;
  return {
    count: Number(raw.count) || 0,
    amount: Number(raw.amount) || 0,
    tripExpenseIds: raw.trip_expense_ids ?? [],
    tripIds: raw.trip_ids ?? [],
    reference: raw.reference === "approved" ? "approved" : "created",
    items: (raw.items ?? []).map((item) => ({
      tripExpenseId: item.trip_expense_id,
      tripId: item.trip_id,
      tripCode: item.trip_code,
      description: item.description,
      amount: Number(item.amount),
      approvedAt: item.approved_at,
    })),
  };
}

export function mapReimbursementLine(raw: ApiReimbursementPreviewLineRaw): ReimbursementPreviewLine {
  return {
    tripExpenseId: raw.trip_expense_id,
    tripId: raw.trip_id,
    tripCode: raw.trip_code,
    category: raw.category,
    description: raw.description,
    amount: Number(raw.amount),
    receiptNumber: raw.receipt_number ?? null,
    approvedAt: raw.approved_at,
    isLate: Boolean(raw.is_late),
    tripSettledIn: mapTripSettledIn(raw.trip_settled_in),
  };
}

export function mapReimbursementRequiringPayeeLine(
  raw: ApiReimbursementRequiringPayeeLineRaw,
): ReimbursementRequiringPayeeLine {
  return {
    tripExpenseId: raw.trip_expense_id,
    tripId: raw.trip_id,
    tripCode: raw.trip_code,
    category: raw.category,
    description: raw.description,
    amount: Number(raw.amount),
    approvedAt: raw.approved_at,
    reason: "driver_reassigned",
    tripSettledIn: mapTripSettledIn(raw.trip_settled_in),
  };
}

function mapTemplateSnapshot(
  raw: Record<string, unknown> | null | undefined,
): DriverSettlement["templateSnapshot"] {
  if (raw == null) return null;
  const camel = deepToCamel(raw) as Record<string, unknown>;
  const templateName =
    typeof camel.templateName === "string"
      ? camel.templateName
      : typeof raw.template_name === "string"
        ? raw.template_name
        : null;
  const templateId =
    typeof camel.templateId === "string"
      ? camel.templateId
      : typeof raw.template_id === "string"
        ? raw.template_id
        : null;
  const versionRaw = camel.version ?? raw.version;
  const version =
    versionRaw === null || versionRaw === undefined
      ? null
      : Number(versionRaw);
  return {
    templateId,
    templateName,
    version: Number.isFinite(version) ? version : null,
    familyId:
      typeof camel.familyId === "string"
        ? camel.familyId
        : typeof raw.family_id === "string"
          ? raw.family_id
          : null,
    assignmentId:
      typeof camel.assignmentId === "string"
        ? camel.assignmentId
        : typeof raw.assignment_id === "string"
          ? raw.assignment_id
          : null,
  };
}

export function mapSettlement(raw: ApiDriverSettlementRaw): DriverSettlement {
  const snapshot = deepToCamel(raw.agreement_snapshot) as unknown as DriverSettlement["agreementSnapshot"];
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    settlementNumber: raw.settlement_number,
    settlementKind: mapSettlementKind(raw.settlement_kind),
    employeeId: raw.employee_id,
    employeeFullName: raw.employee_full_name ?? "",
    agreementSnapshot: snapshot,
    templateSnapshot: mapTemplateSnapshot(raw.template_snapshot),
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    status: raw.status as DriverSettlement["status"],
    totalTripsCommission: Number(raw.total_trips_commission),
    totalBaseSalary: Number(raw.total_base_salary),
    totalReimbursableExpenses: Number(raw.total_reimbursable_expenses),
    totalBonuses: Number(raw.total_bonuses),
    totalAdvancesDeducted: Number(raw.total_advances_deducted),
    totalOtherDeductions: Number(raw.total_other_deductions),
    grossAmount: Number(raw.gross_amount),
    netAmount: Number(raw.net_amount),
    uncoveredDeductionsAmount: optionalNumber(raw.uncovered_deductions_amount),
    tripsCount: raw.trips_count !== undefined ? Number(raw.trips_count) : undefined,
    currency: raw.currency,
    submittedAt: raw.submitted_at ?? null,
    submittedBy: raw.submitted_by ?? null,
    submittedByName: raw.submitted_by_name ?? null,
    disbursedAt: raw.disbursed_at,
    disbursedBy: raw.disbursed_by,
    disbursedByName: raw.disbursed_by_name,
    disbursementMethod: raw.disbursement_method as DriverSettlement["disbursementMethod"],
    disbursementReference: raw.disbursement_reference,
    approvedAt: raw.approved_at,
    approvedBy: raw.approved_by,
    approvedByName: raw.approved_by_name,
    rejectionReason: raw.rejection_reason,
    notes: raw.notes,
    items: raw.items ? raw.items.map(mapSettlementItem) : undefined,
    hasManualAdjustments: Boolean(raw.has_manual_adjustments),
    voboRequired: raw.vobo_required,
    advancesReserved: Boolean(raw.advances_reserved),
    advancesApplied: Boolean(raw.advances_applied),
    selfSegregatedApproval: Boolean(raw.self_segregated_approval),
    approverCountAtApprove:
      raw.approver_count_at_approve === undefined || raw.approver_count_at_approve === null
        ? null
        : Number(raw.approver_count_at_approve),
    selfSegregatedDisbursement: Boolean(raw.self_segregated_disbursement),
    executorCountAtDisburse:
      raw.executor_count_at_disburse === undefined || raw.executor_count_at_disburse === null
        ? null
        : Number(raw.executor_count_at_disburse),
    advancesDeductedAtCreate: Boolean(raw.advances_deducted_at_create),
    ...(raw.approval_revision !== undefined
      ? { approvalRevision: raw.approval_revision }
      : {}),
    ...(raw.approval !== undefined
      ? { approval: raw.approval ? mapApprovalBlock(raw.approval) : null }
      : {}),
    createdBy: raw.created_by ?? null,
    createdByName: raw.created_by_name ?? null,
    ...(raw.late_reimbursements !== undefined
      ? { lateReimbursements: mapLateReimbursements(raw.late_reimbursements) }
      : {}),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapTemplatePeriodAssignmentRef(
  raw: ApiTemplatePeriodAssignmentRefRaw,
): TemplatePeriodAssignmentRef {
  return {
    assignmentId: raw.assignment_id,
    templateId: raw.template_id,
    templateName: raw.template_name,
    templateVersion: Number(raw.template_version),
    effectiveFrom: raw.effective_from,
    effectiveTo: raw.effective_to ?? null,
    isClosing: Boolean(raw.is_closing),
  };
}

export function mapTemplateChange(
  raw: ApiTemplateChangeInPeriodRaw | null | undefined,
): SettlementTemplateChange | null {
  if (!raw?.from || !raw.to) return null;
  return {
    templatesCount: Number(raw.templates_count),
    from: mapTemplatePeriodAssignmentRef(raw.from),
    to: mapTemplatePeriodAssignmentRef(raw.to),
    assignments: (raw.assignments ?? []).map(mapTemplatePeriodAssignmentRef),
  };
}

function finiteVersion(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const version = Number(value);
  return Number.isFinite(version) ? version : null;
}

function mapTemplateReplacement(
  raw: ApiTemplateVersionSupersededRaw["replaced_by"],
): TemplateVersionReplacementRef | null {
  const version = finiteVersion(raw?.template_version);
  if (!raw?.template_id || !raw.template_name || version === null) return null;
  return {
    templateId: raw.template_id,
    templateName: raw.template_name,
    templateVersion: version,
  };
}

/** Sin id, nombre o versión válida no hay texto que mostrar: se trata como ausente. */
export function mapTemplateSuperseded(
  raw: ApiTemplateVersionSupersededRaw | null | undefined,
): SettlementTemplateSuperseded | null {
  const version = finiteVersion(raw?.template_version);
  if (!raw?.template_id || !raw.template_name || version === null) return null;
  return {
    templateId: raw.template_id,
    templateName: raw.template_name,
    templateVersion: version,
    assignmentId: raw.assignment_id ?? "",
    supersededAt: raw.superseded_at ?? null,
    replacedBy: mapTemplateReplacement(raw.replaced_by),
  };
}

function mapPreviewTemplate(
  raw: NonNullable<ApiSettlementPreviewRaw["template"]>,
): NonNullable<SettlementPreview["template"]> {
  const version = finiteVersion(raw.version);
  const payability =
    raw.payability === "active" || raw.payability === "superseded" ? raw.payability : null;
  return {
    id: raw.id,
    name: raw.name,
    assignmentId: raw.assignment_id,
    ...(version !== null ? { version } : {}),
    ...(payability !== null ? { payability } : {}),
  };
}

export function mapSettlementPreview(raw: ApiSettlementPreviewRaw): SettlementPreview {
  return {
    employeeId: raw.employee_id,
    employeeName: raw.employee_name,
    ...(raw.settlement_kind !== undefined
      ? { settlementKind: mapSettlementKind(raw.settlement_kind) }
      : {}),
    ...(raw.reimbursements !== undefined
      ? { reimbursements: raw.reimbursements.map(mapReimbursementLine) }
      : {}),
    ...(raw.reimbursements_requiring_payee !== undefined
      ? {
          reimbursementsRequiringPayee: raw.reimbursements_requiring_payee.map(
            mapReimbursementRequiringPayeeLine,
          ),
        }
      : {}),
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    agreement: deepToCamel(raw.agreement) as unknown as SettlementPreview["agreement"],
    template: raw.template ? mapPreviewTemplate(raw.template) : undefined,
    templateChange: mapTemplateChange(raw.template_change),
    templateSuperseded: mapTemplateSuperseded(raw.template_superseded),
    employeeCompensation: raw.employee_compensation
      ? {
          baseSalary: Number(raw.employee_compensation.base_salary),
          salaryType: raw.employee_compensation.salary_type,
        }
      : undefined,
    fixedAllowances: raw.fixed_allowances?.map((line) => ({
      id: line.id,
      label: line.label,
      amount: Number(line.amount),
      suspended: Boolean(line.suspended),
    })),
    deductions: raw.deductions?.map((line) => ({
      id: line.id,
      deductionType: line.deduction_type,
      label: line.label,
      amount: Number(line.amount),
      isMandatory: Boolean(line.is_mandatory),
      requestedAmount: optionalNumber(line.requested_amount),
      appliedAmount: optionalNumber(line.applied_amount),
      omittedAmount: optionalNumber(line.omitted_amount),
    })),
    eligibleTrips: (raw.eligible_trips ?? []).map((trip) => ({
      tripId: trip.trip_id,
      tripCode: trip.trip_code,
      routeType: trip.route_type as EligibleTripPreview["routeType"],
      scheduledDeparture: trip.scheduled_departure,
      completedAt: trip.completed_at,
      originCity: trip.origin_city,
      destinationCity: trip.destination_city,
      distanceKm: Number(trip.distance_km),
      freightRevenue: Number(trip.freight_revenue),
      appliedRule: trip.applied_rule ?? null,
      calculatedCommission: Number(trip.calculated_commission),
      approvedReimbursableExpenses: Number(trip.approved_reimbursable_expenses),
      corridorMatch: trip.corridor_match
        ? {
            corridorId: trip.corridor_match.corridor_id,
            name: trip.corridor_match.name,
            fixedAmount: Number(trip.corridor_match.fixed_amount),
            replacesKmCommission: Boolean(trip.corridor_match.replaces_km_commission),
          }
        : undefined,
      freightBase: trip.freight_base,
      midTripShareRatio:
        trip.mid_trip_share_ratio !== undefined
          ? Number(trip.mid_trip_share_ratio)
          : undefined,
      participantCount:
        trip.participant_count !== undefined
          ? Number(trip.participant_count)
          : undefined,
      operationalOutcome:
        trip.operational_outcome === "false_trip" ? "false_trip" : "standard",
      hasRevenueSplit: Boolean(trip.has_revenue_split),
      distanceBasis: trip.distance_basis,
      requiresZeroKmAck: Boolean(trip.requires_zero_km_ack),
      requiresZeroFreightAck: Boolean(trip.requires_zero_freight_ack),
      zeroCommissionReason: trip.zero_commission_reason ?? null,
      commissionBeforeMinimum: nullableNumber(trip.commission_before_minimum),
      minimumGuaranteedAmount: nullableNumber(trip.minimum_guaranteed_amount),
      minimumGuaranteedApplied: Boolean(trip.minimum_guaranteed_applied),
      calculationGap: mapCalculationGap(trip.calculation_gap),
    })),
    openAdvances: (raw.open_advances ?? []).map((adv) => ({
      advanceId: adv.advance_id,
      folio: adv.folio,
      amount: Number(adv.amount),
      balanceRemaining: Number(adv.balance_remaining),
      reservedAmount:
        adv.reserved_amount !== undefined ? Number(adv.reserved_amount) : undefined,
      availableBalance:
        adv.available_balance !== undefined ? Number(adv.available_balance) : undefined,
      reservedBySettlementNumber: adv.reserved_by_settlement_number ?? null,
      category: adv.category as OpenAdvancePreview["category"],
      disbursedAt: adv.disbursed_at,
    })),
    summary: {
      totalCommissions: Number(raw.summary.total_commissions),
      totalBaseSalary: Number(raw.summary.total_base_salary),
      totalFixedAllowances:
        raw.summary.total_fixed_allowances !== undefined
          ? Number(raw.summary.total_fixed_allowances)
          : undefined,
      totalReimbursements: Number(raw.summary.total_reimbursements),
      totalDeductions:
        raw.summary.total_deductions !== undefined
          ? Number(raw.summary.total_deductions)
          : undefined,
      totalDeductionsOmitted: optionalNumber(raw.summary.total_deductions_omitted),
      suggestedAdvanceDeduction: Number(raw.summary.suggested_advance_deduction),
      grossAmount: Number(raw.summary.gross_amount),
      netAmount: Number(raw.summary.net_amount),
    },
    periodicBlock: raw.periodic_block
      ? {
          status: raw.periodic_block.status,
          settlement: raw.periodic_block.settlement
            ? {
                settlementId: raw.periodic_block.settlement.settlement_id,
                settlementNumber: raw.periodic_block.settlement.settlement_number,
                status: raw.periodic_block.settlement.status as SettlementPeriodOverlapStatus,
                periodStart: raw.periodic_block.settlement.period_start,
                periodEnd: raw.periodic_block.settlement.period_end,
              }
            : null,
          suggestedPeriodStart: raw.periodic_block.suggested_period_start ?? null,
        }
      : undefined,
  };
}

export function mapListSettlementsResponse(response: {
  data: ApiDriverSettlementRaw[];
  pagination: ApiPaginationRaw;
}): MappedPaginatedResult<DriverSettlement> {
  return {
    data: (response.data || []).map(mapSettlement),
    pagination: extractPagination(response.pagination),
  };
}

export function mapListAdvancesResponse(response: {
  data: ApiDriverAdvanceRaw[];
  pagination: ApiPaginationRaw;
}): MappedPaginatedResult<DriverAdvance> {
  return {
    data: (response.data || []).map(mapAdvance),
    pagination: extractPagination(response.pagination),
  };
}

export interface ApiSettlementPeriodOverlapRaw {
  settlement_id: string;
  status: string;
  settlement_number: string;
  conflicts_count: number;
  period_start?: string;
  period_end?: string;
  created_at?: string;
  overlap_kind?: "contained" | "partial";
}

export interface ApiSettlementBacklogRowRaw {
  employee_id: string;
  employee_full_name: string;
  branch_id?: string | null;
  branch_name?: string | null;
  period_start: string;
  period_end: string;
  pending_trips_count: number;
  oldest_trip_age_days: number;
  estimated_net_amount?: number | null;
  row_type: string;
  warnings?: string[];
  employment_type?: string;
  /** Ausente o null = sin solape / API pre-F2 (compat soft CTA F1). */
  period_overlap?: ApiSettlementPeriodOverlapRaw | null;
  /** D-1 C1 (API F5). Ausente en el API anterior. */
  template_change?: ApiTemplateChangeInPeriodRaw | null;
  /** api#59 F3. Ausente en el API anterior. */
  template_superseded?: ApiTemplateVersionSupersededRaw | null;
  suggested_period_start?: string | null;
  pending_reimbursements_count?: number;
  pending_reimbursements_amount?: number;
  late_reimbursements_count?: number;
  reimbursements_requiring_payee_count?: number;
}

export interface ApiWorkbenchKpiBucketRaw {
  count?: number;
  amount?: number;
}

export interface ApiSettlementWorkbenchRaw {
  summary?: {
    pending?: number;
    draft?: number;
    approval?: number;
    payable?: number;
    closed?: number;
    open_advances?: number;
    approval_aging_days_max?: number | null;
    advances_deductible_estimate?: number;
    kpis?: {
      to_arm?: ApiWorkbenchKpiBucketRaw;
      in_approval?: ApiWorkbenchKpiBucketRaw;
      authorized_unpaid?: ApiWorkbenchKpiBucketRaw;
      advances_to_deduct?: ApiWorkbenchKpiBucketRaw;
    };
  };
  backlog?: ApiSettlementBacklogRowRaw[];
}

export interface ApiSettlementsNavBadgesRaw {
  payments?: number;
  advances?: number;
}

export interface ApiAdvancePeriodDeductionPlanRaw {
  advance_id: string;
  amount_per_period: number;
  available_balance: number;
  projected_periods_estimate: number;
}

function mapPeriodOverlap(
  raw: ApiSettlementPeriodOverlapRaw | null | undefined,
): SettlementPeriodOverlap | null {
  if (!raw?.settlement_id) return null;
  return {
    settlementId: raw.settlement_id,
    status: raw.status as SettlementPeriodOverlapStatus,
    settlementNumber: raw.settlement_number ?? "",
    conflictsCount: Number(raw.conflicts_count ?? 0),
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    createdAt: raw.created_at,
    overlapKind: raw.overlap_kind,
  };
}

export function mapBacklogRow(raw: ApiSettlementBacklogRowRaw): SettlementBacklogRow {
  return {
    employeeId: raw.employee_id,
    employeeFullName: raw.employee_full_name,
    branchId: raw.branch_id ?? null,
    branchName: raw.branch_name ?? null,
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    pendingTripsCount: Number(raw.pending_trips_count ?? 0),
    oldestTripAgeDays: Number(raw.oldest_trip_age_days ?? 0),
    estimatedNetAmount:
      raw.estimated_net_amount !== undefined && raw.estimated_net_amount !== null
        ? Number(raw.estimated_net_amount)
        : null,
    rowType: (raw.row_type as SettlementBacklogRow["rowType"]) || "trips_pending",
    warnings: (raw.warnings ?? []) as SettlementBacklogRow["warnings"],
    periodOverlap: mapPeriodOverlap(raw.period_overlap),
    templateChange: mapTemplateChange(raw.template_change),
    templateSuperseded: mapTemplateSuperseded(raw.template_superseded),
    suggestedPeriodStart: raw.suggested_period_start ?? null,
    employmentType: raw.employment_type,
    pendingReimbursementsCount: Number(raw.pending_reimbursements_count ?? 0),
    pendingReimbursementsAmount: Number(raw.pending_reimbursements_amount ?? 0),
    lateReimbursementsCount: Number(raw.late_reimbursements_count ?? 0),
    reimbursementsRequiringPayeeCount: Number(raw.reimbursements_requiring_payee_count ?? 0),
  };
}

function mapKpiBucket(raw: ApiWorkbenchKpiBucketRaw | undefined): WorkbenchKpiBucket {
  return {
    count: Number(raw?.count ?? 0),
    amount: Number(raw?.amount ?? 0),
  };
}

export function mapWorkbenchResponse(raw: unknown): SettlementWorkbenchData {
  const payload = (raw ?? {}) as ApiSettlementWorkbenchRaw;
  const summaryRaw = payload.summary ?? {};
  const kpisRaw = summaryRaw.kpis;
  const summary: SettlementWorkbenchSummary = {
    pending: Number(summaryRaw.pending ?? 0),
    draft: Number(summaryRaw.draft ?? 0),
    approval: Number(summaryRaw.approval ?? 0),
    payable: Number(summaryRaw.payable ?? 0),
    closed: Number(summaryRaw.closed ?? 0),
    openAdvances: Number(summaryRaw.open_advances ?? 0),
    approvalAgingDaysMax:
      summaryRaw.approval_aging_days_max === undefined
        ? undefined
        : summaryRaw.approval_aging_days_max === null
          ? null
          : Number(summaryRaw.approval_aging_days_max),
    advancesDeductibleEstimate:
      summaryRaw.advances_deductible_estimate === undefined
        ? undefined
        : Number(summaryRaw.advances_deductible_estimate),
    ...(kpisRaw
      ? {
          kpis: {
            toArm: mapKpiBucket(kpisRaw.to_arm),
            inApproval: mapKpiBucket(kpisRaw.in_approval),
            authorizedUnpaid: mapKpiBucket(kpisRaw.authorized_unpaid),
            advancesToDeduct: mapKpiBucket(kpisRaw.advances_to_deduct),
          },
        }
      : {}),
  };
  const backlog = (payload.backlog ?? []).map(mapBacklogRow);
  return { summary, backlog };
}

export function mapNavBadgesResponse(raw: unknown): SettlementsNavBadges {
  const payload = (raw ?? {}) as ApiSettlementsNavBadgesRaw;
  return {
    payments: Number(payload.payments ?? 0),
    advances: Number(payload.advances ?? 0),
  };
}

export function mapAdvancePeriodDeductionPlan(
  raw: ApiAdvancePeriodDeductionPlanRaw,
): AdvancePeriodDeductionPlan {
  return {
    advanceId: raw.advance_id,
    amountPerPeriod: Number(raw.amount_per_period),
    availableBalance: Number(raw.available_balance),
    projectedPeriodsEstimate: Number(raw.projected_periods_estimate),
  };
}

export function mapSettlementSettings(
  raw: ApiTenantSettlementSettingsRaw,
): TenantSettlementSettings {
  return {
    voboThresholdMxn:
      raw.vobo_threshold_mxn === undefined
        ? DEFAULT_VOBO_THRESHOLD_MXN
        : raw.vobo_threshold_mxn === null
          ? null
          : Number(raw.vobo_threshold_mxn),
    activeApproverCount: Number(raw.active_approver_count) || 0,
    activeExecutorCount: Number(raw.active_executor_count) || 0,
  };
}

// ============================================================================
// OPERATOR PAYMENT READINESS (F3)
// ============================================================================

export interface ApiOperatorPaymentReadinessTemplateRaw {
  id: string;
  name: string;
  version: number;
  effective_from: string;
  payability: string;
}

export interface ApiOperatorPaymentReadinessSalaryRaw {
  amount: number | null;
  period: string | null;
}

/** Snake_case de `GET /settlements/operators` — HB-T5: nunca `bank_clabe` / CLABE. */
export interface ApiOperatorPaymentReadinessRaw {
  employee_id: string;
  full_name: string;
  employment_type: string;
  status: string;
  template: ApiOperatorPaymentReadinessTemplateRaw | null;
  salary: ApiOperatorPaymentReadinessSalaryRaw | null;
  has_clabe: boolean;
  open_advances_count: number;
  open_advances_balance: number;
  attention_reasons: string[];
}

const OPERATOR_STATUS_SET = new Set<OperatorPaymentReadinessStatus>([
  "ready",
  "no_template",
  "template_not_payable",
  "template_scheduled",
  "dual_template",
  "no_clabe",
  "version_superseded",
]);

const OPERATOR_TEMPLATE_PAYABILITY_SET = new Set<OperatorTemplatePayability>([
  "active",
  "superseded",
  "draft",
  "deactivated",
]);

function asOperatorStatus(raw: string): OperatorPaymentReadinessStatus {
  return OPERATOR_STATUS_SET.has(raw as OperatorPaymentReadinessStatus)
    ? (raw as OperatorPaymentReadinessStatus)
    : "no_template";
}

function asTemplatePayability(raw: string): OperatorTemplatePayability {
  return OPERATOR_TEMPLATE_PAYABILITY_SET.has(raw as OperatorTemplatePayability)
    ? (raw as OperatorTemplatePayability)
    : "active";
}

function asAttentionReasons(
  raw: string[] | undefined,
): OperatorPaymentAttentionReason[] {
  if (!raw?.length) return [];
  return raw.filter(
    (code): code is OperatorPaymentAttentionReason =>
      code !== "ready" && OPERATOR_STATUS_SET.has(code as OperatorPaymentReadinessStatus),
  );
}

export function mapOperatorPaymentReadiness(
  raw: ApiOperatorPaymentReadinessRaw,
): OperatorPaymentReadiness {
  const templateRaw = raw.template;
  return {
    employeeId: raw.employee_id,
    fullName: raw.full_name,
    employmentType: raw.employment_type,
    status: asOperatorStatus(raw.status),
    template: templateRaw
      ? {
          id: templateRaw.id,
          name: templateRaw.name,
          version: Number(templateRaw.version) || 0,
          effectiveFrom: String(templateRaw.effective_from ?? "").slice(0, 10),
          payability: asTemplatePayability(templateRaw.payability),
        }
      : null,
    salary: {
      amount:
        raw.salary?.amount === undefined || raw.salary?.amount === null
          ? null
          : Number(raw.salary.amount),
      period: raw.salary?.period ?? null,
    },
    hasClabe: Boolean(raw.has_clabe),
    openAdvancesCount: Number(raw.open_advances_count) || 0,
    openAdvancesBalance: Number(raw.open_advances_balance) || 0,
    attentionReasons: asAttentionReasons(raw.attention_reasons),
  };
}

export function mapListOperatorsResponse(response: {
  data: ApiOperatorPaymentReadinessRaw[];
  pagination: ApiPaginationRaw;
}): MappedPaginatedResult<OperatorPaymentReadiness> {
  return {
    data: (response.data || []).map(mapOperatorPaymentReadiness),
    pagination: extractPagination(response.pagination, 1, 25),
  };
}

// ============================================================================
// SETTLEMENT CUT (F6)
// ============================================================================

export interface ApiSettlementCutWarningRaw {
  code: string;
  message: string;
}

export interface ApiSettlementCutPreviewRowRaw {
  employee_id: string;
  employee_full_name: string;
  employment_type: string;
  salary_period: string;
  estimated_net: number | null;
  estimated_gross: number | null;
  max_advance_deductible: number | null;
  suggested_advance_deduction: number | null;
  trip_ids: string[];
  warnings: ApiSettlementCutWarningRaw[];
  effect: string;
  primary_reason: string | null;
  period_overlap: ApiSettlementPeriodOverlapRaw | null;
  suggested_period_start: string | null;
  open_advances_balance: number;
}

export interface ApiSettlementCutPreviewSummaryRaw {
  eligible_count: number;
  includable_count: number;
  blocking_count: number;
  excluded_count: number;
  estimated_net_total: number;
  max_rows: number;
}

export interface ApiSettlementCutPreviewRaw {
  period_start: string;
  period_end: string;
  salary_period: string;
  include_contractors: boolean;
  eligible: ApiSettlementCutPreviewRowRaw[];
  excluded: ApiSettlementCutPreviewRowRaw[];
  summary: ApiSettlementCutPreviewSummaryRaw;
}

export interface ApiSettlementCutCreatedRowRaw {
  employee_id: string;
  settlement_id: string;
  settlement_number: string;
  status: string;
  net_amount: number;
}

export interface ApiSettlementCutOmittedRowRaw {
  employee_id: string;
  reason_code: string;
  message: string;
  http_status: number;
}

export interface ApiSettlementCutCreateRaw {
  created: ApiSettlementCutCreatedRowRaw[];
  omitted: ApiSettlementCutOmittedRowRaw[];
  idempotent_replay: boolean;
}

function mapCutWarning(raw: ApiSettlementCutWarningRaw): SettlementCutWarning {
  return {
    code: raw.code as SettlementCutWarningCode,
    message: raw.message,
  };
}

function mapCutPreviewRow(raw: ApiSettlementCutPreviewRowRaw): SettlementCutPreviewRow {
  return {
    employeeId: raw.employee_id,
    employeeFullName: raw.employee_full_name,
    employmentType: raw.employment_type,
    salaryPeriod: raw.salary_period as CompensationSalaryPeriod,
    estimatedNet:
      raw.estimated_net === null || raw.estimated_net === undefined
        ? null
        : Number(raw.estimated_net),
    estimatedGross:
      raw.estimated_gross === null || raw.estimated_gross === undefined
        ? null
        : Number(raw.estimated_gross),
    maxAdvanceDeductible:
      raw.max_advance_deductible === null ||
      raw.max_advance_deductible === undefined
        ? null
        : Number(raw.max_advance_deductible),
    suggestedAdvanceDeduction:
      raw.suggested_advance_deduction === null ||
      raw.suggested_advance_deduction === undefined
        ? null
        : Number(raw.suggested_advance_deduction),
    tripIds: raw.trip_ids ?? [],
    warnings: (raw.warnings ?? []).map(mapCutWarning),
    effect: raw.effect as SettlementCutEffect,
    primaryReason: (raw.primary_reason as SettlementCutWarningCode | null) ?? null,
    periodOverlap: mapPeriodOverlap(raw.period_overlap),
    suggestedPeriodStart: raw.suggested_period_start ?? null,
    openAdvancesBalance: Number(raw.open_advances_balance ?? 0),
  };
}

function mapCutPreviewSummary(
  raw: ApiSettlementCutPreviewSummaryRaw,
): SettlementCutPreviewSummary {
  return {
    eligibleCount: Number(raw.eligible_count ?? 0),
    includableCount: Number(raw.includable_count ?? 0),
    blockingCount: Number(raw.blocking_count ?? 0),
    excludedCount: Number(raw.excluded_count ?? 0),
    estimatedNetTotal: Number(raw.estimated_net_total ?? 0),
    maxRows: Number(raw.max_rows ?? 100),
  };
}

export function mapSettlementCutPreview(
  raw: ApiSettlementCutPreviewRaw,
): SettlementCutPreview {
  return {
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    salaryPeriod: raw.salary_period as SettlementCutSalaryPeriod,
    includeContractors: Boolean(raw.include_contractors),
    eligible: (raw.eligible ?? []).map(mapCutPreviewRow),
    excluded: (raw.excluded ?? []).map(mapCutPreviewRow),
    summary: mapCutPreviewSummary(raw.summary),
  };
}

function mapCutCreatedRow(raw: ApiSettlementCutCreatedRowRaw): SettlementCutCreatedRow {
  return {
    employeeId: raw.employee_id,
    settlementId: raw.settlement_id,
    settlementNumber: raw.settlement_number,
    status: raw.status,
    netAmount: Number(raw.net_amount ?? 0),
  };
}

function mapCutOmittedRow(raw: ApiSettlementCutOmittedRowRaw): SettlementCutOmittedRow {
  return {
    employeeId: raw.employee_id,
    reasonCode: raw.reason_code,
    message: raw.message,
    httpStatus: Number(raw.http_status ?? 0),
  };
}

export function mapSettlementCutCreateResult(
  raw: ApiSettlementCutCreateRaw,
  message?: string,
): SettlementCutCreateResult {
  return {
    created: (raw.created ?? []).map(mapCutCreatedRow),
    omitted: (raw.omitted ?? []).map(mapCutOmittedRow),
    idempotentReplay: Boolean(raw.idempotent_replay),
    message,
  };
}

// =============================================================================
// F7 — batch approve / reject / disburse
// =============================================================================

export interface ApiSettlementBatchProcessedRowRaw {
  settlement_id: string;
  settlement_number: string;
  status: string;
  net_amount: number;
  approval_outcome?: "approved" | "step_signed" | "rejected" | null;
  disbursement_method?: string | null;
}

export interface ApiSettlementBatchOmittedRowRaw {
  settlement_id: string;
  reason_code: string;
  reason: string;
  http_status: number;
}

export interface ApiSettlementBatchActionRaw {
  processed: ApiSettlementBatchProcessedRowRaw[];
  omitted: ApiSettlementBatchOmittedRowRaw[];
}

function mapBatchProcessedRow(
  raw: ApiSettlementBatchProcessedRowRaw,
): SettlementBatchProcessedRow {
  return {
    settlementId: raw.settlement_id,
    settlementNumber: raw.settlement_number,
    status: raw.status,
    netAmount: Number(raw.net_amount ?? 0),
    approvalOutcome: raw.approval_outcome ?? null,
    disbursementMethod: raw.disbursement_method ?? null,
  };
}

function mapBatchOmittedRow(
  raw: ApiSettlementBatchOmittedRowRaw,
): SettlementBatchOmittedRow {
  return {
    settlementId: raw.settlement_id,
    reasonCode: raw.reason_code as SettlementBatchReasonCode,
    reason: raw.reason,
    httpStatus: Number(raw.http_status ?? 0),
  };
}

export function mapSettlementBatchActionResult(
  raw: ApiSettlementBatchActionRaw,
  message?: string,
): SettlementBatchActionResult {
  return {
    processed: (raw.processed ?? []).map(mapBatchProcessedRow),
    omitted: (raw.omitted ?? []).map(mapBatchOmittedRow),
    message,
  };
}
