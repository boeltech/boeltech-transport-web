import type { Pagination } from "@shared/api";

export type ApprovableType =
  | "trip_expense"
  | "internal_staff_compensation"
  | "driver_advance_request"
  | "fuel_transaction"
  | "maintenance_order"
  | "vehicle_doc_renewal"
  | "overhead_expense";

export type ApprovalStatus =
  | "pending"
  | "documented"
  | "approved"
  | "rejected";

export interface TripExpenseContext {
  approvableType: "trip_expense";
  tripId: string;
  tripCode: string;
  driverId: string | null;
  driverFullName: string | null;
  vehicleId: string | null;
  vehicleUnitNumber: string | null;
  expenseCategory: string;
  description: string | null;
  occurredAt: string;
  hasInvoice?: boolean;
  receiptNumber?: string | null;
  receiptType?: "cfdi" | "ticket" | "none" | string | null;
}

export interface InternalStaffCompensationContext {
  approvableType: "internal_staff_compensation";
  settlementId?: string;
  settlementNumber?: string;
  employeeId?: string;
  employeeFullName?: string;
  periodStart?: string;
  periodEnd?: string;
  /** ADR-0085 E11 punto 9: un pago de reembolsos muestra su fecha de alta, no el período. */
  settlementKind?: "regular" | "reimbursement_only";
  createdAt?: string;
  tripsCount?: number;
  grossAmount?: number;
  totalDeductions?: number;
  netAmount?: number;
}

export interface DriverAdvanceRequestContext {
  approvableType: "driver_advance_request";
  advanceId?: string;
  folio?: string;
  employeeId?: string;
  employeeFullName?: string;
  category?: string;
  tripId?: string | null;
  tripCode?: string | null;
  paymentMethod?: string;
  notes?: string | null;
  openAdvancesBalance?: number;
  openAdvancesCount?: number;
}

export interface FuelTransactionContext {
  approvableType: "fuel_transaction";
}

export interface MaintenanceOrderContext {
  approvableType: "maintenance_order";
}

export interface VehicleDocRenewalContext {
  approvableType: "vehicle_doc_renewal";
}

export interface OverheadExpenseContext {
  approvableType: "overhead_expense";
}

export type ApprovableContext =
  | TripExpenseContext
  | InternalStaffCompensationContext
  | DriverAdvanceRequestContext
  | FuelTransactionContext
  | MaintenanceOrderContext
  | VehicleDocRenewalContext
  | OverheadExpenseContext;

/** ADR-0099: `not_started` = pendiente sin instancia escrita (se decide con la regla vigente). */
export type ApprovalFlowStatus =
  | "not_started"
  | "in_progress"
  | "approved"
  | "rejected"
  | "returned"
  | "superseded"
  | "cancelled";

export type ApprovalCannotActReason =
  | "no_permission"
  | "not_eligible"
  | "already_signed"
  | "self_action"
  | "no_active_eligible"
  | "returned"
  | "closed";

export type ApprovalReturnReasonCode =
  | "missing_receipt"
  | "wrong_amount"
  | "wrong_operator"
  | "other";

export const APPROVAL_RETURN_REASON_CODES: readonly ApprovalReturnReasonCode[] = [
  "missing_receipt",
  "wrong_amount",
  "wrong_operator",
  "other",
];

export interface ApprovalBlockUser {
  userId: string;
  fullName: string | null;
}

export interface ApprovalSignedStep {
  stepNo: number;
  userId: string | null;
  fullName: string | null;
  role: string | null;
  decidedAt: string | null;
}

/** Campo material que cambió (evento `invalidated` / reautorización). */
export interface ApprovalFieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

/**
 * Qué anuló la corrección: `approved` = una autorización vigente (heredada en
 * cadena hasta que alguien vuelva a autorizar); `in_progress` = el flujo seguía
 * abierto; `null` = la instancia no lo guarda.
 */
export type ApprovalReapprovalPreviousStatus = "approved" | "in_progress";

/** ADR-0099 §3.9: estado del flujo visto por el usuario que consulta. */
export interface ApprovalBlock {
  flowStatus: ApprovalFlowStatus;
  /** `null` si el flujo ya no espera firma. */
  stepCurrent: number | null;
  stepsTotal: number;
  pendingFor: { roles: string[]; users: ApprovalBlockUser[] };
  /**
   * Paso siguiente al actual. `undefined` = el API no lo informa (fallback al
   * copy sin rol); `null` = no hay paso siguiente.
   */
  nextStep?: { stepNo: number; roles: string[]; users: ApprovalBlockUser[] } | null;
  signedSteps: ApprovalSignedStep[];
  routedBy: {
    tierIndex: number | null;
    minAmount: number | null;
    matchedConditions: string[];
    /** `null` = regla estándar (tenant sin política propia). */
    policyVersion: number | null;
    lazy: boolean;
  };
  canAct: boolean;
  cannotActReason: ApprovalCannotActReason | null;
  escalated: boolean;
  reapproval: {
    invalidatedAt: string | null;
    previousInstanceId: string | null;
    previousStatus: ApprovalReapprovalPreviousStatus | null;
    /** Acumulado contra lo autorizado cuando `previousStatus = approved`; puede venir vacío. */
    changes: ApprovalFieldChange[];
  } | null;
  returned: {
    reason: string | null;
    reasonCode: string | null;
    returnedBy: string | null;
    returnedByName: string | null;
    returnedAt: string | null;
  } | null;
}

export type ApprovalDecisionOutcome =
  | "approved"
  | "rejected"
  | "step_signed"
  | "returned";

/** Guardas de concurrencia (handoff F6 §6); nunca se reintenta solo. */
export interface ApprovalGuards {
  expectedStep?: number;
  expectedRevision?: string;
}

export interface ApprovableItem {
  approvableType: ApprovableType;
  id: string;
  amount: number;
  currency: "MXN" | "USD" | "EUR";
  category: string;
  status: ApprovalStatus;
  submittedAt: string;
  submittedBy: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  /** ADR-0098: autorizado por quien lo envió (único autorizador activo). */
  selfApproved?: boolean;
  context: ApprovableContext;
  /** ADR-0099: versión material que se reenvía como `expected_revision`. */
  approvalRevision?: string | null;
  /**
   * ADR-0099: bloque del flujo. `undefined` = la respuesta no lo trae;
   * `null` = decidido antes del motor (comportamiento previo).
   */
  approval?: ApprovalBlock | null;
}

/** Cola de la bandeja: «Me toca» (`assigned_to_me`) o «Todas» (`include_returned`). */
export type ApprovalQueue = "mine" | "all";

export interface ListApprovalsFilters {
  type: ApprovableType;
  status?: ApprovalStatus;
  category?: string;
  tripId?: string;
  driverId?: string;
  vehicleId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  selfApproved?: boolean;
  /** ADR-0099 «Me toca». */
  assignedToMe?: boolean;
  /** ADR-0099: suma los devueltos para corregir a los pendientes. */
  includeReturned?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginatedApprovals {
  data: ApprovableItem[];
  pagination: Pagination;
}

export type BulkAction = "approve" | "reject" | "return";

export interface BulkOperation extends ApprovalGuards {
  type: ApprovableType;
  id: string;
  action: BulkAction;
  reason?: string;
  reasonCode?: ApprovalReturnReasonCode;
}

export interface BulkSuccess {
  type: ApprovableType;
  id: string;
  item: ApprovableItem;
  outcome?: ApprovalDecisionOutcome;
}

export interface BulkFailure {
  type: ApprovableType;
  id: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApprovalDecisionResult {
  data: ApprovableItem;
  /** `null` si el API no reporta el resultado (respuesta previa a ADR-0099). */
  outcome: ApprovalDecisionOutcome | null;
  message?: string;
}

export interface ReturnApprovableInput extends ApprovalGuards {
  reason: string;
  reasonCode: ApprovalReturnReasonCode;
}

export interface ApprovalHistoryEntry {
  id: string;
  instanceId: string | null;
  stepNo: number | null;
  eventType: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  reason: string | null;
  reasonCode: string | null;
  changes: ApprovalFieldChange[];
  policyVersionId: string | null;
  policyVersion: number | null;
  createdAt: string;
}

export interface BulkResult {
  successes: BulkSuccess[];
  failures: BulkFailure[];
}

export const APPROVABLE_ACTIONABLE_STATUSES: readonly ApprovalStatus[] = [
  "pending",
  "documented",
];

export function isApprovableActionable(item: Pick<ApprovableItem, "status">): boolean {
  return APPROVABLE_ACTIONABLE_STATUSES.includes(item.status);
}
