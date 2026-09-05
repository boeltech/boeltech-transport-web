/**
 * Settlements Domain Entities
 * Clean Architecture - Domain Layer
 *
 * Entidades inmutables para Acuerdos de Compensación, Anticipos y Liquidaciones.
 */

import type {
  AdvanceCategory,
  AdvanceStatus,
  AgreementCommissionType,
  CompensationCalculationType,
  CompensationSalaryPeriod,
  DisbursementMethod,
  SettlementItemType,
  SettlementStatus,
  TripRouteType,
} from "./enums";

// ============================================================================
// 1. ACUERDO DE COMPENSACIÓN (Compensation Agreement)
// ============================================================================

export interface CompensationAgreementRule {
  readonly id?: string;
  readonly agreementId?: string;
  readonly routeType: TripRouteType;
  readonly commissionType: AgreementCommissionType;
  readonly rateValue: number;
  readonly minimumGuaranteedAmount?: number;
  readonly notes?: string | null;
}

export interface CompensationAgreement {
  readonly id: string;
  readonly tenantId: string;
  readonly employeeId: string;
  readonly employeeFullName?: string;
  // Campos compuestos (ADR-0086)
  readonly hasFixedSalary?: boolean;
  readonly fixedSalaryAmount?: number;
  readonly fixedSalaryPeriod?: CompensationSalaryPeriod;
  readonly isSalaryGuaranteed?: boolean;
  readonly rules?: readonly CompensationAgreementRule[];
  // Campos planos (retrocompatibilidad ADR-0085)
  readonly calculationType?: CompensationCalculationType;
  readonly baseRate?: number;
  readonly ratePerKm?: number;
  readonly percentageRate?: number;
  readonly helperDailyRate?: number;
  readonly currency: string;
  readonly effectiveFrom: string; // ISO date 'YYYY-MM-DD'
  readonly effectiveTo: string | null;
  readonly isActive: boolean;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ============================================================================
// 2. ANTICIPOS A OPERADORES (Driver Advances)
// ============================================================================

export interface DriverAdvance {
  readonly id: string;
  readonly tenantId: string;
  readonly folio: string;
  readonly employeeId: string;
  readonly employeeFullName?: string;
  readonly tripId: string | null;
  readonly tripCode?: string | null;
  readonly amount: number;
  readonly balanceRemaining: number;
  readonly currency: string;
  readonly category: AdvanceCategory;
  readonly status: AdvanceStatus;
  readonly disbursedAt: string | null;
  readonly paymentMethod: DisbursementMethod;
  readonly bankReference: string | null;
  readonly submittedAt?: string | null;
  readonly submittedBy?: string | null;
  readonly submittedByName?: string | null;
  readonly approvedAt?: string | null;
  readonly approvedBy?: string | null;
  readonly approvedByName?: string | null;
  readonly rejectedAt?: string | null;
  readonly rejectedBy?: string | null;
  readonly rejectedByName?: string | null;
  readonly rejectionReason?: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ============================================================================
// 3. PARTIDAS DE LIQUIDACIÓN (Settlement Items)
// ============================================================================

export interface SettlementItemCalculationDetails {
  readonly distanceKm?: number;
  readonly ratePerKm?: number;
  readonly freightRevenue?: number;
  readonly percentageRate?: number;
  readonly dailyRate?: number;
  readonly daysWorked?: number;
  readonly fixedAmount?: number;
  readonly expenseCategory?: string;
  readonly category?: string;
  readonly routeType?: string;
  readonly appliedRule?: string;
  readonly receiptNumber?: string | null;
  readonly receiptFolio?: string | null;
  readonly originalAdvanceAmount?: number;
  readonly advanceFolio?: string | null;
}

export interface SettlementItem {
  readonly id: string;
  readonly settlementId: string;
  readonly itemType: SettlementItemType;
  readonly tripId: string | null;
  readonly tripCode?: string | null;
  readonly tripExpenseId: string | null;
  readonly advanceId: string | null;
  readonly description: string;
  readonly quantity: number;
  readonly unitRate: number;
  readonly amount: number;
  readonly isDeduction: boolean;
  readonly calculationDetails?: SettlementItemCalculationDetails | null;
  readonly createdAt: string;
}

// ============================================================================
// 4. LIQUIDACIÓN (Driver Settlement - Aggregate Root)
// ============================================================================

export interface AgreementSnapshot {
  // Modelo compuesto (ADR-0086)
  readonly hasFixedSalary?: boolean;
  readonly fixedSalaryAmount?: number;
  readonly fixedSalaryPeriod?: CompensationSalaryPeriod;
  readonly isSalaryGuaranteed?: boolean;
  readonly rules?: readonly CompensationAgreementRule[];
  // Modelo plano (ADR-0085)
  readonly calculationType?: CompensationCalculationType;
  readonly baseRate?: number;
  readonly ratePerKm?: number;
  readonly percentageRate?: number;
  readonly helperDailyRate?: number;
  readonly currency: string;
}

export interface DriverSettlement {
  readonly id: string;
  readonly tenantId: string;
  readonly settlementNumber: string;
  readonly employeeId: string;
  readonly employeeFullName: string;
  readonly agreementSnapshot: AgreementSnapshot;
  readonly periodStart: string; // ISO date 'YYYY-MM-DD'
  readonly periodEnd: string;   // ISO date 'YYYY-MM-DD'
  readonly status: SettlementStatus;
  readonly totalTripsCommission: number;
  readonly totalBaseSalary: number;
  readonly totalReimbursableExpenses: number;
  readonly totalBonuses: number;
  readonly totalAdvancesDeducted: number;
  readonly totalOtherDeductions: number;
  readonly grossAmount: number;
  readonly netAmount: number;
  readonly tripsCount?: number;
  readonly currency: string;
  readonly createdBy?: string | null;
  readonly createdByName?: string | null;
  readonly submittedBy?: string | null;
  readonly submittedByName?: string | null;
  readonly submittedAt?: string | null;
  readonly disbursedAt: string | null;
  readonly disbursedBy: string | null;
  readonly disbursedByName?: string | null;
  readonly disbursementMethod: DisbursementMethod | null;
  readonly disbursementReference: string | null;
  readonly approvedAt: string | null;
  readonly approvedBy: string | null;
  readonly approvedByName?: string | null;
  readonly rejectionReason: string | null;
  readonly notes: string | null;
  readonly items?: readonly SettlementItem[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ============================================================================
// 5. PREVIEW DE LIQUIDACIÓN (Settlement Preview)
// ============================================================================

export interface EligibleTripPreview {
  readonly tripId: string;
  readonly tripCode: string;
  readonly routeType?: TripRouteType;
  readonly scheduledDeparture: string;
  readonly completedAt: string | null;
  readonly originCity: string;
  readonly destinationCity: string;
  readonly distanceKm: number;
  readonly freightRevenue: number;
  readonly appliedRule?: string | null;
  readonly calculatedCommission: number;
  readonly approvedReimbursableExpenses: number;
  readonly corridorMatch?: {
    readonly corridorId: string;
    readonly name: string;
    readonly fixedAmount: number;
    readonly replacesKmCommission: boolean;
  };
}

export interface OpenAdvancePreview {
  readonly advanceId: string;
  readonly folio: string;
  readonly amount: number;
  readonly balanceRemaining: number;
  readonly category: AdvanceCategory;
  readonly disbursedAt: string | null;
}

export interface SettlementPreviewSummary {
  readonly totalCommissions: number;
  readonly totalBaseSalary: number;
  readonly totalFixedAllowances?: number;
  readonly totalReimbursements: number;
  readonly suggestedAdvanceDeduction: number;
  readonly grossAmount: number;
  readonly netAmount: number;
}

export interface CompensationTemplatePreviewRef {
  readonly id: string;
  readonly name: string;
  readonly assignmentId: string;
}

export interface FixedAllowancePreviewLine {
  readonly id: string;
  readonly label: string;
  readonly amount: number;
  readonly suspended: boolean;
}

export interface SettlementPreview {
  readonly employeeId: string;
  readonly employeeName: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly agreement: AgreementSnapshot;
  readonly template?: CompensationTemplatePreviewRef;
  readonly employeeCompensation?: {
    readonly baseSalary: number;
    readonly salaryType: string | null;
  };
  readonly fixedAllowances?: readonly FixedAllowancePreviewLine[];
  readonly eligibleTrips: readonly EligibleTripPreview[];
  readonly openAdvances: readonly OpenAdvancePreview[];
  readonly summary: SettlementPreviewSummary;
}

// ============================================================================
// 6. WORKBENCH / BACKLOG (vista calculada — ADR-0085 handoff Capa 1)
// ============================================================================

export type SettlementBacklogRowType =
  | "trips_pending"
  | "salary_close"
  | "mixed";

export type SettlementBacklogWarning =
  | "no_client_invoice"
  | "period_overlap"
  | "open_advance";

export interface SettlementBacklogRow {
  readonly employeeId: string;
  readonly employeeFullName: string;
  readonly branchId: string | null;
  readonly branchName: string | null;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly pendingTripsCount: number;
  readonly oldestTripAgeDays: number;
  readonly estimatedNetAmount: number | null;
  readonly rowType: SettlementBacklogRowType;
  readonly warnings: readonly SettlementBacklogWarning[];
  readonly employmentType?: string;
}

export interface SettlementWorkbenchSummary {
  readonly pending: number;
  readonly draft: number;
  readonly approval: number;
  readonly payable: number;
  readonly closed: number;
  readonly openAdvances: number;
}

export interface SettlementWorkbenchData {
  readonly summary: SettlementWorkbenchSummary;
  readonly backlog: readonly SettlementBacklogRow[];
}
