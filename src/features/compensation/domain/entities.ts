import type {
  AgreementCommissionType,
  TripRouteType,
} from "@features/settlements";
import type {
  AssignmentBlockingSettlementStatus,
  BatchAssignmentConflictReason,
  CompensationTemplateEventAction,
  CompensationTemplateInactiveReason,
  CompensationTemplateLockedReason,
  CompensationTemplateStatus,
  CorridorRefType,
  FixedAllowancePeriod,
  FixedAllowanceType,
  TemplateDeductionType,
} from "./enums";
import type { MidTripPayoutPolicy } from "@features/settlements/domain/enums";

export interface CompensationTemplateRule {
  id?: string;
  routeType: TripRouteType;
  commissionType: AgreementCommissionType;
  rateValue: number;
  minimumGuaranteedAmount: number;
  notes?: string | null;
  sortOrder?: number;
}

export interface TemplateFixedAllowance {
  id?: string;
  allowanceType: FixedAllowanceType;
  label: string;
  amount: number;
  period: FixedAllowancePeriod;
  isMandatory: boolean;
}

export interface TemplateDeduction {
  id?: string;
  deductionType: TemplateDeductionType;
  label: string;
  amount: number;
  period: FixedAllowancePeriod;
  isMandatory: boolean;
}

export interface RouteCorridorTariff {
  id: string;
  name: string;
  originRefType: CorridorRefType;
  originRefValue: string;
  destinationRefType: CorridorRefType;
  destinationRefValue: string;
  fixedAmount: number;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Pares ciudad origen→destino frecuentes en viajes del tenant (sugerencia de alta). */
export interface FrequentCityPair {
  originCity: string;
  destinationCity: string;
  originState: string | null;
  destinationState: string | null;
  tripCount: number;
  lastUsedAt: string;
}

export interface CompensationTemplate {
  id: string;
  name: string;
  description?: string | null;
  /** Derivado de status === "active" (compat listados legacy). */
  isActive: boolean;
  status: CompensationTemplateStatus;
  version: number;
  familyId: string;
  supersedesTemplateId?: string | null;
  /** true si ya hay liquidaciones que referencian esta versión. */
  lockedForEdit: boolean;
  /** `undefined` = la API aún no envía el campo; `null` = sin motivo. */
  lockedReason?: CompensationTemplateLockedReason | null;
  /** `undefined` = la API aún no envía el campo; `null` = inactiva sin motivo registrado. */
  inactiveReason?: CompensationTemplateInactiveReason | null;
  supersededByTemplateId?: string | null;
  inactivatedAt?: string | null;
  midTripPayoutPolicy?: MidTripPayoutPolicy;
  rules: CompensationTemplateRule[];
  fixedAllowances: TemplateFixedAllowance[];
  deductions: TemplateDeduction[];
  corridorIds: string[];
  corridors: RouteCorridorTariff[];
  /** Asignaciones vigentes hoy (isActive + ventana de fechas). */
  activeAssignmentsCount: number;
  /** Activas que empiezan después de hoy (CDMX). `undefined` = la API aún no envía el campo. */
  scheduledAssignmentsCount?: number;
  /** Solo en el listado agrupado por familia (`groupBy: "family"`). */
  family?: CompensationTemplateFamilySummary;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompensationTemplateVersionRef {
  id: string;
  version: number;
}

/** Resumen de la familia completa, sin los filtros del listado. */
export interface CompensationTemplateFamilySummary {
  versionsCount: number;
  activeVersion: CompensationTemplateVersionRef | null;
  /** Borrador de mayor versión de la familia, sin contar la fila. */
  draftVersion: CompensationTemplateVersionRef | null;
  /** Vigentes hoy (CDMX) en las otras versiones reemplazadas de la familia. */
  supersededActiveAssignmentsCount: number;
  /** Programadas (empiezan después de hoy) en las otras versiones reemplazadas. */
  supersededScheduledAssignmentsCount: number;
}

export interface CompensationTemplateListQuery {
  search?: string;
  status?: CompensationTemplateStatus;
  /** Compat sin agrupar: active → status=active. No se envía con `status` ni con `groupBy`. */
  isActive?: boolean;
  /** Implica `status=inactive`; `manual` incluye las desactivadas sin motivo. */
  inactiveReason?: CompensationTemplateInactiveReason;
  /** «Vigentes»: activas, borradores y reemplazadas con operadores vigentes o programados. */
  scope?: "current";
  /** Una fila por familia; la paginación cuenta familias. */
  groupBy?: "family";
  page?: number;
  pageSize?: number;
}

export interface CompensationTemplateEvent {
  id: string;
  templateId: string;
  familyId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorFirstName?: string | null;
  actorLastName?: string | null;
  action: CompensationTemplateEventAction;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface TemplateAssignment {
  id: string;
  employeeId: string;
  employeeFullName?: string | null;
  templateId: string;
  templateName?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  assignedBy?: string | null;
  reason?: string | null;
  /**
   * Formó parte de alguna liquidación (cualquier estado): no se puede eliminar.
   * `undefined` = la API aún no envía el campo.
   */
  isUsedInSettlement?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Liquidación viva que congela días de una asignación (api#62). */
export interface AssignmentBlockingSettlement {
  settlementId: string;
  settlementNumber: string;
  status: AssignmentBlockingSettlementStatus;
  periodStart: string;
  periodEnd: string;
}

/** `details` del 409 `ASSIGNMENT_PERIOD_SETTLED` en alta, cierre, baja o eliminación. */
export interface AssignmentPeriodSettledError {
  message: string;
  existingAssignmentId: string | null;
  blockingSettlements: AssignmentBlockingSettlement[];
  blockingSettlementsTotal: number;
  minEffectiveTo: string | null;
  suggestedEffectiveFrom: string | null;
}

/** Prestación o deducción fija desalineada vs `salary_type` (api#60). */
export interface PeriodMismatchItem {
  kind: "fixed_allowance" | "deduction";
  id: string;
  label: string;
  period: FixedAllowancePeriod;
}

/**
 * Operador omitido por el lote o por su vista previa. Campos opcionales: la API
 * anterior a api#63 solo envía `employeeId`, `code` y a veces `message`.
 */
export interface BatchAssignmentConflict {
  employeeId: string;
  code: string;
  message?: string;
  /** Ausente en un 409 no previsto o con la API anterior. */
  reason?: BatchAssignmentConflictReason;
  employeeFullName?: string | null;
  existingAssignmentId?: string | null;
  existingTemplateId?: string | null;
  existingTemplateName?: string | null;
  existingTemplateVersion?: number | null;
  existingEffectiveFrom?: string | null;
  existingEffectiveTo?: string | null;
  /** Solo `overlap_close_disabled`: fecha en que se cerraría con la casilla marcada. */
  closePreviousOn?: string | null;
  suggestedEffectiveFrom?: string | null;
  blockingSettlements?: AssignmentBlockingSettlement[];
  blockingSettlementsTotal?: number;
  minEffectiveTo?: string | null;
  /** Solo `period_mismatch` (api#60): ritmo del operador. */
  employeeSalaryType?: FixedAllowancePeriod | null;
  /** Solo `period_mismatch` (api#60): prestaciones/deducciones ofensoras. */
  mismatches?: PeriodMismatchItem[];
}

export interface BatchAssignmentResult {
  createdCount: number;
  skippedCount: number;
  conflicts: BatchAssignmentConflict[];
  created: TemplateAssignment[];
}

/** Asignación que el lote cerraría el día anterior al nuevo «Vigente desde». */
export interface BatchAssignmentPlannedClosure {
  employeeId: string;
  employeeFullName: string | null;
  assignmentId: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  effectiveFrom: string;
  /** Fin antes del cierre; `null` = abierta. */
  effectiveTo: string | null;
  closeTo: string;
}

export interface BatchAssignmentPreviewEmployee {
  employeeId: string;
  employeeFullName: string | null;
  outcome: "create" | "skip";
}

/** Vista previa del lote (orientativa: el resultado del lote manda). */
export interface BatchAssignmentPreview {
  wouldCreateCount: number;
  wouldSkipCount: number;
  /** En el orden enviado, sin duplicados. */
  employees: BatchAssignmentPreviewEmployee[];
  conflicts: BatchAssignmentConflict[];
  /** Solo de operadores que se asignarían. */
  closures: BatchAssignmentPlannedClosure[];
}

export interface CreateCompensationTemplatePayload {
  name: string;
  description?: string | null;
  /** Ignorado por API (siempre nace draft). Conservado por compat de callers. */
  isActive?: boolean;
  midTripPayoutPolicy?: MidTripPayoutPolicy;
  rules?: CompensationTemplateRule[];
  fixedAllowances?: TemplateFixedAllowance[];
  deductions?: TemplateDeduction[];
  corridorIds?: string[];
}

export interface ActivateCompensationTemplatePayload {
  deactivateSiblings?: boolean;
}

export interface ReplaceTemplateConfigurationPayload {
  rules: CompensationTemplateRule[];
  fixedAllowances: TemplateFixedAllowance[];
  deductions: TemplateDeduction[];
  corridorIds: string[];
}

export interface UpdateCompensationTemplatePayload {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  midTripPayoutPolicy?: MidTripPayoutPolicy;
  rules?: CompensationTemplateRule[];
  fixedAllowances?: TemplateFixedAllowance[];
  /** Si se omite, el API preserva las deducciones existentes. */
  deductions?: TemplateDeduction[];
  corridorIds?: string[];
}

export interface CreateCorridorTariffPayload {
  name: string;
  originRefType: CorridorRefType;
  originRefValue: string;
  destinationRefType: CorridorRefType;
  destinationRefValue: string;
  fixedAmount: number;
  notes?: string | null;
  isActive?: boolean;
}

export interface BatchTemplateAssignmentPayload {
  templateId: string;
  employeeIds: string[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  closePreviousAssignment?: boolean;
  reason?: string | null;
}

export interface FixedAllowanceOverride {
  id: string;
  employeeId: string;
  allowanceId: string;
  periodStart: string;
  periodEnd: string;
  isSuspended: boolean;
  createdBy?: string | null;
  createdAt?: string;
}

export interface UpsertFixedAllowanceOverridePayload {
  employeeId: string;
  allowanceId: string;
  periodStart: string;
  periodEnd: string;
  isSuspended: boolean;
}

export interface UpdateTemplateAssignmentPayload {
  isActive?: boolean;
  effectiveTo?: string | null;
}
