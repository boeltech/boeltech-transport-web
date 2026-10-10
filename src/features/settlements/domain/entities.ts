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
  MidTripPayoutPolicy,
  SettlementItemType,
  SettlementStatus,
  TripRouteType,
} from "./enums";
import type { ApprovalBlock } from "@features/approvals";

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
  readonly midTripPayoutPolicy?: MidTripPayoutPolicy;
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
  readonly reservedAmount?: number;
  readonly availableBalance?: number;
  readonly currency: string;
  readonly category: AdvanceCategory;
  readonly status: AdvanceStatus;
  readonly disbursedAt: string | null;
  readonly paymentMethod: DisbursementMethod;
  /** Método con el que se autorizó; difiere de `paymentMethod` si se entregó por otro medio. */
  readonly authorizedPaymentMethod?: DisbursementMethod;
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
  readonly createdBy?: string | null;
  readonly disbursedBy?: string | null;
  /** ADR-0098: autorizado por quien lo creó/envió (único autorizador activo). */
  readonly selfSegregatedApproval?: boolean;
  readonly approverCountAtApprove?: number | null;
  /** ADR-0098: entregado por quien lo creó/envió (único ejecutor activo). */
  readonly selfSegregatedDisbursement?: boolean;
  readonly executorCountAtDisburse?: number | null;
  /** ADR-0099: guarda `expected_revision`. */
  readonly approvalRevision?: string | null;
  /** ADR-0099: `undefined` = API sin bloque; `null` = registro previo al motor. */
  readonly approval?: ApprovalBlock | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** ADR-0099 D17: efecto de editar un anticipo sobre su autorización. */
export type AdvanceApprovalEffect = "none" | "flow_restarted" | "reapproval_required";

export interface UpdateDriverAdvanceResult {
  readonly advance: DriverAdvance;
  readonly approvalEffect: AdvanceApprovalEffect;
  readonly changes: string[];
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
  /** E10: `manual` (o ausente) = partida capturada; `fixed_allowance` / `template_deduction` = de la tarifa. */
  readonly source?: string | null;
  /** Deducción de tarifa que no cupo en el bruto: lo configurado y lo omitido (`amount` = aplicado). */
  readonly requestedAmount?: number;
  readonly omittedAmount?: number;
  /** ADR-0085 E11 — comisión de viaje en $0: por qué quedó así. */
  readonly zeroReason?: ZeroCommissionReason | null;
  /**
   * ADR-0086 D1 (enmienda 2026-10-09). Sin `minimumGuaranteedApplied` la partida
   * es anterior al mínimo en $0.
   */
  readonly commissionBeforeMinimum?: number | null;
  readonly minimumGuaranteedAmount?: number | null;
  readonly minimumGuaranteedApplied?: boolean;
  readonly calculationGap?: CommissionCalculationGap | null;
  /** ADR-0085 E11 punto 7(b): el viaje del reembolso ya estaba en otro pago del operador. */
  readonly isLate?: boolean;
  /**
   * ADR-0085 E11 punto 9: pago que trae la comisión del viaje del reembolso.
   * `null` = sin comisión en pagos del operador; ausente = el viaje va en este pago.
   */
  readonly tripSettledIn?: TripSettledInRef | null;
  /** ADR-0085 E11 punto 8: `manual` = asignado a este operador por cambio de conductor. */
  readonly payeeResolution?: "manual" | null;
  readonly confirmedBy?: string | null;
  readonly confirmedAt?: string | null;
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
  readonly midTripPayoutPolicy?: MidTripPayoutPolicy;
  readonly currency: string;
}

/** ADR-0085 E11 punto 9: `reimbursement_only` = «Pago de reembolsos» (sin viajes ni período). */
export type SettlementKind = "regular" | "reimbursement_only";

/** Pago del operador que trae la comisión de un viaje. */
export interface TripSettledInRef {
  readonly settlementId: string;
  readonly settlementNumber: string;
}

export interface LateReimbursementItem {
  readonly tripExpenseId: string;
  readonly tripId: string;
  readonly tripCode: string;
  readonly description: string;
  readonly amount: number;
  readonly approvedAt: string | null;
}

/** ADR-0085 E11 punto 10: gastos aprobados después de armar o autorizar el pago. */
export interface LateReimbursementsSummary {
  readonly count: number;
  readonly amount: number;
  readonly tripExpenseIds: readonly string[];
  readonly tripIds: readonly string[];
  /** `approved`: posteriores a la autorización; `created`: posteriores al alta. */
  readonly reference: "approved" | "created";
  readonly items: readonly LateReimbursementItem[];
}

export interface DriverSettlement {
  readonly id: string;
  readonly tenantId: string;
  readonly settlementNumber: string;
  readonly settlementKind: SettlementKind;
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
  /** Descuentos que el neto no cubrió (> 0 solo en históricos); `undefined` = API previo. */
  readonly uncoveredDeductionsAmount?: number;
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
  readonly hasManualAdjustments?: boolean;
  readonly voboRequired?: boolean;
  readonly advancesReserved?: boolean;
  readonly advancesApplied?: boolean;
  /** D3′: true si se autorizó con un solo autorizador activo. */
  readonly selfSegregatedApproval?: boolean;
  readonly approverCountAtApprove?: number | null;
  /** D3′: true si se registró el pago con un solo ejecutor activo. */
  readonly selfSegregatedDisbursement?: boolean;
  readonly executorCountAtDisburse?: number | null;
  /** E10: los anticipos se descontaron al crear (no se cambian al corregir). */
  readonly advancesDeductedAtCreate?: boolean;
  /** ADR-0099: guarda `expected_revision` (decidir y dispersar). */
  readonly approvalRevision?: string | null;
  /** ADR-0099: `undefined` = API sin bloque; `null` = registro previo al motor. */
  readonly approval?: ApprovalBlock | null;
  /** Solo en el detalle de `draft` / `pending_approval` / `approved`. */
  readonly lateReimbursements?: LateReimbursementsSummary | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** ADR-0085 E10: efecto de corregir una liquidación sobre su autorización. */
export type SettlementApprovalEffect = "none" | "flow_restarted" | "reapproval_required";

export interface UpdateSettlementResult {
  readonly settlement: DriverSettlement;
  readonly approvalEffect: SettlementApprovalEffect;
  readonly changes: string[];
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
  readonly freightBase?: "commercial_at_complete" | "live_base_rate";
  readonly midTripShareRatio?: number;
  /** Operadores que participaron en el viaje (badge «Varios operadores» si > 1). */
  readonly participantCount?: number;
  /** ADR-0079 — badge «Viaje en falso» en preview. */
  readonly operationalOutcome?: "standard" | "false_trip";
  /** ADR-0081 — badge «Prorrateo» (hubo reparto multi-RFC). */
  readonly hasRevenueSplit?: boolean;
  readonly distanceBasis?: "executed_stops" | "odometer" | "unavailable";
  readonly requiresZeroKmAck?: boolean;
  /** ADR-0085 E11.2: regla por porcentaje con flete en $0; se confirma al enviar. */
  readonly requiresZeroFreightAck?: boolean;
  /** ADR-0085 E11 — por qué el viaje entra en $0; null si paga comisión o aplicó el mínimo. */
  readonly zeroCommissionReason?: ZeroCommissionReason | null;
  /** ADR-0086 D1: `null` con ruta fija o sin regla. */
  readonly commissionBeforeMinimum?: number | null;
  /** ADR-0086 D1: 0 con `none`; `null` con ruta fija o sin regla. */
  readonly minimumGuaranteedAmount?: number | null;
  readonly minimumGuaranteedApplied?: boolean;
  /** Dato faltante (km o flete), haya aplicado o no el mínimo. */
  readonly calculationGap?: CommissionCalculationGap | null;
}

/** ADR-0085 E11 — esquema en $0, sin km, sin flete o sin regla para el tipo de ruta. */
export type ZeroCommissionReason = "scheme" | "zero_km" | "zero_freight" | "no_rule";

/** ADR-0085 E11.2 — tarifa por km sin distancia o porcentaje sin flete. */
export type CommissionCalculationGap = "zero_km" | "zero_freight";

/** Pago vivo que ya cubre (total o parcialmente) el bloque de periodo. */
export interface PeriodicBlockSettlementRef {
  readonly settlementId: string;
  readonly settlementNumber: string;
  readonly status: SettlementPeriodOverlapStatus;
  readonly periodStart: string;
  readonly periodEnd: string;
}

/**
 * ADR-0085 E11 — sueldo, fijos y deducciones de plantilla van una vez por periodo.
 * `excluded_contained`: otro pago vivo ya lo cubre; `partial_overlap`: bloquea el alta.
 */
export interface PeriodicBlockPreview {
  readonly status: "included" | "excluded_contained" | "partial_overlap" | "not_applicable";
  readonly settlement: PeriodicBlockSettlementRef | null;
  readonly suggestedPeriodStart: string | null;
}

export interface OpenAdvancePreview {
  readonly advanceId: string;
  readonly folio: string;
  readonly amount: number;
  readonly balanceRemaining: number;
  readonly reservedAmount?: number;
  /** 0 si otro pago lo tiene reservado (una sola reserva por anticipo). */
  readonly availableBalance?: number;
  /** Folio del otro pago que lo reserva; `null` si está libre. */
  readonly reservedBySettlementNumber?: string | null;
  readonly category: AdvanceCategory;
  readonly disbursedAt: string | null;
}

export interface SettlementPreviewSummary {
  readonly totalCommissions: number;
  readonly totalBaseSalary: number;
  readonly totalFixedAllowances?: number;
  readonly totalReimbursements: number;
  /** Deducciones de plantilla aplicadas (fondo de ahorro, retenciones, etc.). */
  readonly totalDeductions?: number;
  /** Deducciones de plantilla que no cupieron en el bruto (no se arrastran). */
  readonly totalDeductionsOmitted?: number;
  readonly suggestedAdvanceDeduction: number;
  readonly grossAmount: number;
  readonly netAmount: number;
}

export interface TemplateDeductionPreviewLine {
  readonly id: string;
  readonly deductionType: string;
  readonly label: string;
  /** Monto configurado en la plantilla. */
  readonly amount: number;
  readonly isMandatory: boolean;
  readonly requestedAmount?: number;
  readonly appliedAmount?: number;
  readonly omittedAmount?: number;
}

export interface CompensationTemplatePreviewRef {
  readonly id: string;
  readonly name: string;
  readonly assignmentId: string;
  /** api#59 F3; ausente en el API anterior. */
  readonly version?: number;
  /** api#59 F3; ausente en el API anterior. */
  readonly payability?: "active" | "superseded";
}

/** api#59: versión activa hoy en la familia; puede ser menor que la reemplazada. */
export interface TemplateVersionReplacementRef {
  readonly templateId: string;
  readonly templateName: string;
  readonly templateVersion: number;
}

/** api#59 V8: el período se paga con una versión de tarifa reemplazada. */
export interface SettlementTemplateSuperseded {
  readonly templateId: string;
  readonly templateName: string;
  readonly templateVersion: number;
  readonly assignmentId: string;
  readonly supersededAt: string | null;
  /** `null` si la familia no tiene hoy ninguna versión activa. */
  readonly replacedBy: TemplateVersionReplacementRef | null;
}

export interface FixedAllowancePreviewLine {
  readonly id: string;
  readonly label: string;
  readonly amount: number;
  readonly suspended: boolean;
}

/** ADR-0085 E11 punto 7: gasto pagado por el operador que se le reembolsa. */
export interface ReimbursementPreviewLine {
  readonly tripExpenseId: string;
  readonly tripId: string;
  readonly tripCode: string;
  readonly category: string;
  readonly description: string;
  readonly amount: number;
  readonly receiptNumber: string | null;
  readonly approvedAt: string | null;
  /** 7(b): el viaje ya está en otro pago del operador. */
  readonly isLate: boolean;
  readonly tripSettledIn: TripSettledInRef | null;
}

/** ADR-0085 E11 punto 8: gasto de un viaje con cambio de conductor; solo entra si se marca. */
export interface ReimbursementRequiringPayeeLine {
  readonly tripExpenseId: string;
  readonly tripId: string;
  readonly tripCode: string;
  readonly category: string;
  readonly description: string;
  readonly amount: number;
  readonly approvedAt: string | null;
  readonly reason: "driver_reassigned";
  readonly tripSettledIn: TripSettledInRef | null;
}

export interface SettlementPreview {
  readonly employeeId: string;
  readonly settlementKind?: SettlementKind;
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
  readonly deductions?: readonly TemplateDeductionPreviewLine[];
  readonly eligibleTrips: readonly EligibleTripPreview[];
  readonly openAdvances: readonly OpenAdvancePreview[];
  readonly summary: SettlementPreviewSummary;
  readonly periodicBlock?: PeriodicBlockPreview;
  /** E11 punto 7: (a) viajes del alta + (b) tardíos; en `reimbursement_only` también (c). */
  readonly reimbursements?: readonly ReimbursementPreviewLine[];
  /** E11 punto 8: no suman al total hasta que el usuario los marca. */
  readonly reimbursementsRequiringPayee?: readonly ReimbursementRequiringPayeeLine[];
  /** D-1 C1: el período toca ≥ 2 esquemas; `null` si no aplica o el API aún no lo envía. */
  readonly templateChange?: SettlementTemplateChange | null;
  /** api#59 V8: `null` si no aplica o el API aún no lo envía. */
  readonly templateSuperseded?: SettlementTemplateSuperseded | null;
}

/** D-1 C1: asignación de esquema que toca el período. */
export interface TemplatePeriodAssignmentRef {
  readonly assignmentId: string;
  readonly templateId: string;
  readonly templateName: string;
  /** Las versiones de una familia pueden compartir nombre. */
  readonly templateVersion: number;
  readonly effectiveFrom: string;
  /** `null` = abierta. */
  readonly effectiveTo: string | null;
  readonly isClosing: boolean;
}

/** D-1 C1: cambio de esquema dentro del período. */
export interface SettlementTemplateChange {
  /** Esquemas distintos; ≥ 2. */
  readonly templatesCount: number;
  /** Esquema inmediatamente anterior al del cierre. */
  readonly from: TemplatePeriodAssignmentRef;
  /** Asignación del cierre (la que usa la preliquidación). */
  readonly to: TemplatePeriodAssignmentRef;
  /** Asignaciones que tocan el período, `effectiveFrom` ASC. */
  readonly assignments: readonly TemplatePeriodAssignmentRef[];
}

// ============================================================================
// 6. WORKBENCH / BACKLOG (vista calculada — ADR-0085 handoff Capa 1)
// ============================================================================

export type SettlementBacklogRowType =
  | "trips_pending"
  | "salary_close"
  | "mixed"
  /** ADR-0085 E11 punto 9: solo reembolsos (sin viajes por pagar, dado de baja o sin tarifa). */
  | "reimbursement_only";

export type SettlementBacklogWarning =
  | "no_client_invoice"
  | "period_overlap"
  | "open_advance"
  | "late_reimbursement"
  | "reimbursement_payee_required"
  | "template_change_in_period"
  | "template_version_superseded";

/** Status activos de solape de período (excluye cancelled/rejected). */
export type SettlementPeriodOverlapStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "disbursed";

/** Enrich F2 del backlog: conflicto primario cuando hay `period_overlap`. */
export interface SettlementPeriodOverlap {
  readonly settlementId: string;
  readonly status: SettlementPeriodOverlapStatus;
  readonly settlementNumber: string;
  readonly conflictsCount: number;
  readonly periodStart?: string;
  readonly periodEnd?: string;
  readonly createdAt?: string;
  /** ADR-0085 E11 — `contained`: el periodo ya está cubierto; `partial`: hay que mover la fecha. */
  readonly overlapKind?: "contained" | "partial";
}

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
  /** Null si no hay solape o el API aún no envía el enrich (compat F1). */
  readonly periodOverlap: SettlementPeriodOverlap | null;
  /** D-1 C1: presente con `template_change_in_period`; `null` si no aplica o el API aún no lo envía. */
  readonly templateChange?: SettlementTemplateChange | null;
  /** api#59 V8: presente con `template_version_superseded`; `null` si no aplica o el API aún no lo envía. */
  readonly templateSuperseded?: SettlementTemplateSuperseded | null;
  /** ADR-0085 E11 — día siguiente al último periodo cubierto cuando el solape es parcial. */
  readonly suggestedPeriodStart?: string | null;
  readonly employmentType?: string;
  /** E11 punto 7 (b)+(c), sin los gastos de viajes ya contados en la fila. */
  readonly pendingReimbursementsCount?: number;
  readonly pendingReimbursementsAmount?: number;
  readonly lateReimbursementsCount?: number;
  /** E11 punto 8. */
  readonly reimbursementsRequiringPayeeCount?: number;
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

export interface TenantSettlementSettings {
  /**
   * Umbral de la regla de autorización vigente; se edita solo en esa regla.
   * `null` = la regla no pide autorización por monto (solo las correcciones manuales la piden).
   */
  readonly voboThresholdMxn: number | null;
  /** Usuarios activos con settlements.update (live; F17a). */
  readonly activeApproverCount: number;
  /** Usuarios activos con settlements.execute (live; F17a). */
  readonly activeExecutorCount: number;
}
