/**
 * F6 — corte en lote (POST /settlements/cuts/preview · /cuts).
 * Códigos alineados a API `policy/settlementCutEffects.ts` + PRD §H.
 */

import type { CompensationSalaryPeriod } from "./enums";
import type { SettlementPeriodOverlap } from "./entities";

export type SettlementCutEffect = "includable" | "blocking" | "excluded";

export type SettlementCutWarningCode =
  | "no_payable_template"
  | "salary_period_mismatch"
  | "inactive_or_terminated"
  | "contractor_excluded"
  | "nothing_to_pay"
  | "template_change_in_period"
  | "open_advance"
  | "template_version_superseded"
  | "period_contained"
  | "zero_km_trips"
  | "period_partial_overlap"
  | "trip_in_active_settlement"
  | "missing_ack_no_rule"
  | "missing_ack_zero_km"
  | "missing_ack_zero_freight"
  | "deductions_exceed_capacity"
  | "reimbursement_payee_required"
  | "no_client_invoice";

export type SettlementCutSalaryPeriod = Exclude<
  CompensationSalaryPeriod,
  "none"
>;

export interface SettlementCutWarning {
  readonly code: SettlementCutWarningCode;
  readonly message: string;
}

export interface SettlementCutPreviewRow {
  readonly employeeId: string;
  readonly employeeFullName: string;
  readonly employmentType: string;
  readonly salaryPeriod: CompensationSalaryPeriod;
  readonly estimatedNet: number | null;
  readonly estimatedGross: number | null;
  readonly maxAdvanceDeductible: number | null;
  readonly suggestedAdvanceDeduction: number | null;
  readonly tripIds: readonly string[];
  readonly warnings: readonly SettlementCutWarning[];
  readonly effect: SettlementCutEffect;
  readonly primaryReason: SettlementCutWarningCode | null;
  readonly periodOverlap: SettlementPeriodOverlap | null;
  readonly suggestedPeriodStart: string | null;
  readonly openAdvancesBalance: number;
}

export interface SettlementCutPreviewSummary {
  readonly eligibleCount: number;
  readonly includableCount: number;
  readonly blockingCount: number;
  readonly excludedCount: number;
  readonly estimatedNetTotal: number;
  readonly maxRows: number;
}

export interface SettlementCutPreview {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly salaryPeriod: SettlementCutSalaryPeriod;
  readonly includeContractors: boolean;
  readonly eligible: readonly SettlementCutPreviewRow[];
  readonly excluded: readonly SettlementCutPreviewRow[];
  readonly summary: SettlementCutPreviewSummary;
}

export interface SettlementCutCreatedRow {
  readonly employeeId: string;
  readonly settlementId: string;
  readonly settlementNumber: string;
  readonly status: string;
  readonly netAmount: number;
}

export interface SettlementCutOmittedRow {
  readonly employeeId: string;
  readonly reasonCode: string;
  readonly message: string;
  readonly httpStatus: number;
}

export interface SettlementCutCreateResult {
  readonly created: readonly SettlementCutCreatedRow[];
  readonly omitted: readonly SettlementCutOmittedRow[];
  readonly idempotentReplay: boolean;
  readonly message?: string;
}

export interface PreviewSettlementCutPayload {
  periodStart: string;
  periodEnd: string;
  salaryPeriod: SettlementCutSalaryPeriod;
  includeContractors?: boolean;
  employeeIds?: string[];
}

export interface CreateSettlementCutRowPayload {
  employeeId: string;
  tripIds?: string[];
  confirmedReimbursementExpenseIds?: string[];
  advancesToApply?: { advanceId: string; amountToDeduct: number }[];
  customItems?: unknown[];
  notes?: string | null;
  acknowledgeZeroKmTrips?: boolean;
  acknowledgeZeroFreightTrips?: boolean;
  acknowledgeNoRuleTrips?: boolean;
}

export interface CreateSettlementCutPayload {
  periodStart: string;
  periodEnd: string;
  salaryPeriod: SettlementCutSalaryPeriod;
  includeContractors?: boolean;
  rows: CreateSettlementCutRowPayload[];
  submitForApproval?: boolean;
}
