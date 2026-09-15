import { deepToCamel } from "@shared/api";
import type { MappedPaginatedResult } from "@shared/api";
import type {
  CompensationAgreement,
  CompensationAgreementRule,
  DriverAdvance,
  DriverSettlement,
  EligibleTripPreview,
  OpenAdvancePreview,
  SettlementItem,
  SettlementPreview,
  SettlementBacklogRow,
  SettlementWorkbenchData,
  SettlementWorkbenchSummary,
} from "../domain/entities";

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
  currency: string;
  category: string;
  status: string;
  disbursed_at: string | null;
  payment_method: string;
  bank_reference: string | null;
  submitted_at?: string | null;
  submitted_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
  notes: string | null;
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
  rejection_reason: string | null;
  notes: string | null;
  trips_count?: number;
  created_at: string;
  updated_at: string;
  items?: ApiSettlementItemRaw[];
}

export interface ApiSettlementPreviewRaw {
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  agreement: Record<string, unknown>;
  template?: {
    id: string;
    name: string;
    assignment_id: string;
  };
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
  }>;
  open_advances: Array<{
    advance_id: string;
    folio: string;
    amount: number;
    balance_remaining: number;
    category: string;
    disbursed_at: string | null;
  }>;
  summary: {
    total_commissions: number;
    total_base_salary: number;
    total_fixed_allowances?: number;
    total_reimbursements: number;
    suggested_advance_deduction: number;
    gross_amount: number;
    net_amount: number;
  };
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
    currency: raw.currency,
    category: raw.category as DriverAdvance["category"],
    status: raw.status as DriverAdvance["status"],
    disbursedAt: raw.disbursed_at,
    paymentMethod: raw.payment_method as DriverAdvance["paymentMethod"],
    bankReference: raw.bank_reference,
    submittedAt: raw.submitted_at ?? null,
    submittedBy: raw.submitted_by ?? null,
    approvedAt: raw.approved_at ?? null,
    approvedBy: raw.approved_by ?? null,
    rejectedAt: raw.rejected_at ?? null,
    rejectedBy: raw.rejected_by ?? null,
    rejectionReason: raw.rejection_reason ?? null,
    notes: raw.notes ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
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
      ? (deepToCamel(raw.calculation_details) as SettlementItem["calculationDetails"])
      : null,
    createdAt: raw.created_at,
  };
}

export function mapSettlement(raw: ApiDriverSettlementRaw): DriverSettlement {
  const snapshot = deepToCamel(raw.agreement_snapshot) as unknown as DriverSettlement["agreementSnapshot"];
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    settlementNumber: raw.settlement_number,
    employeeId: raw.employee_id,
    employeeFullName: raw.employee_full_name ?? "",
    agreementSnapshot: snapshot,
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
    tripsCount: raw.trips_count !== undefined ? Number(raw.trips_count) : undefined,
    currency: raw.currency,
    submittedAt: raw.submitted_at ?? null,
    submittedBy: raw.submitted_by ?? null,
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
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function mapSettlementPreview(raw: ApiSettlementPreviewRaw): SettlementPreview {
  return {
    employeeId: raw.employee_id,
    employeeName: raw.employee_name,
    periodStart: raw.period_start,
    periodEnd: raw.period_end,
    agreement: deepToCamel(raw.agreement) as unknown as SettlementPreview["agreement"],
    template: raw.template
      ? {
          id: raw.template.id,
          name: raw.template.name,
          assignmentId: raw.template.assignment_id,
        }
      : undefined,
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
    })),
    openAdvances: (raw.open_advances ?? []).map((adv) => ({
      advanceId: adv.advance_id,
      folio: adv.folio,
      amount: Number(adv.amount),
      balanceRemaining: Number(adv.balance_remaining),
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
      suggestedAdvanceDeduction: Number(raw.summary.suggested_advance_deduction),
      grossAmount: Number(raw.summary.gross_amount),
      netAmount: Number(raw.summary.net_amount),
    },
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
}

export interface ApiSettlementWorkbenchRaw {
  summary?: {
    pending?: number;
    draft?: number;
    approval?: number;
    payable?: number;
    closed?: number;
    open_advances?: number;
  };
  backlog?: ApiSettlementBacklogRowRaw[];
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
    employmentType: raw.employment_type,
  };
}

export function mapWorkbenchResponse(raw: unknown): SettlementWorkbenchData {
  const payload = (raw ?? {}) as ApiSettlementWorkbenchRaw;
  const summaryRaw = payload.summary ?? {};
  const summary: SettlementWorkbenchSummary = {
    pending: Number(summaryRaw.pending ?? 0),
    draft: Number(summaryRaw.draft ?? 0),
    approval: Number(summaryRaw.approval ?? 0),
    payable: Number(summaryRaw.payable ?? 0),
    closed: Number(summaryRaw.closed ?? 0),
    openAdvances: Number(summaryRaw.open_advances ?? 0),
  };
  const backlog = (payload.backlog ?? []).map(mapBacklogRow);
  return { summary, backlog };
}
