import {
  isOwnRecord,
  resolveSelfActionUi,
  type SelfActionUi,
  type SelfApprovalPolicy,
} from "@features/approvals/domain";
import { DEFAULT_VOBO_THRESHOLD_MXN } from "../../domain/enums";
import type { DriverSettlement } from "../../domain/entities";

/**
 * Display gating aligned with API `isVoboRequired`.
 * API remains the source of truth; this only picks CTAs before persist.
 * `thresholdMxn: null` = la regla no pide autorización por monto; `undefined` = default.
 */
export function isVoboRequiredForPreview(input: {
  netAmount: number;
  hasManualAdjustments: boolean;
  thresholdMxn?: number | null;
}): boolean {
  if (input.hasManualAdjustments) return true;
  if (input.thresholdMxn === null) return false;
  const threshold = input.thresholdMxn ?? DEFAULT_VOBO_THRESHOLD_MXN;
  return input.netAmount >= threshold;
}

export type SettlementCreateCta = "pedir_vobo" | "guardar_borrador";

export function resolveCreateCta(input: {
  netAmount: number;
  hasManualAdjustments: boolean;
  thresholdMxn?: number | null;
}): SettlementCreateCta {
  return isVoboRequiredForPreview(input) ? "pedir_vobo" : "guardar_borrador";
}

export type CreateSettlementFeedback =
  | "submitted_for_approval"
  | "saved_as_draft"
  | "degraded_to_draft";

/**
 * El API decide si la liquidación requiere VoBo, así que el aviso se deriva del
 * estado devuelto: pedir VoBo y recibir un borrador significa que el neto quedó
 * bajo el umbral vigente, no que se envió a autorización.
 */
export function resolveCreateSettlementFeedback(input: {
  submitForApproval: boolean;
  resultStatus: string;
}): CreateSettlementFeedback {
  if (!input.submitForApproval) return "saved_as_draft";
  return input.resultStatus === "draft" ? "degraded_to_draft" : "submitted_for_approval";
}

export function isSettlementMaker(
  settlement: Pick<DriverSettlement, "createdBy" | "submittedBy">,
  userId: string | null | undefined,
): boolean {
  return isOwnRecord(userId, [settlement.createdBy, settlement.submittedBy]);
}

/** ADR-0098: autorizar/rechazar lo propio depende de `settlement_approve`. */
export function resolveSettlementApproveUi(
  settlement: Pick<DriverSettlement, "createdBy" | "submittedBy">,
  userId: string | null | undefined,
  policy: SelfApprovalPolicy | null | undefined,
): SelfActionUi {
  return resolveSelfActionUi({
    isOwn: isSettlementMaker(settlement, userId),
    policy: policy?.settlementApprove,
  });
}

/** ADR-0098: registrar el pago de lo propio depende de `settlement_disburse`. */
export function resolveSettlementDisburseUi(
  settlement: Pick<DriverSettlement, "createdBy" | "submittedBy">,
  userId: string | null | undefined,
  policy: SelfApprovalPolicy | null | undefined,
): SelfActionUi {
  return resolveSelfActionUi({
    isOwn: isSettlementMaker(settlement, userId),
    policy: policy?.settlementDisburse,
  });
}

/** Estado/permiso habilitan la acción; la autoacción la decide `selfActionUi`. */
export function isSettlementPendingDecision(input: {
  settlement: Pick<DriverSettlement, "status">;
  canUpdate: boolean;
}): boolean {
  return input.canUpdate && input.settlement.status === "pending_approval";
}

export function canApproveSettlement(input: {
  settlement: Pick<DriverSettlement, "status">;
  canUpdate: boolean;
  selfActionUi: SelfActionUi;
}): boolean {
  return (
    isSettlementPendingDecision(input) && input.selfActionUi !== "blocked_own"
  );
}

export function canRejectSettlement(input: {
  settlement: Pick<DriverSettlement, "status">;
  canUpdate: boolean;
  selfActionUi: SelfActionUi;
}): boolean {
  return canApproveSettlement(input);
}

export function isSettlementAwaitingDisbursement(
  settlement: Pick<DriverSettlement, "status" | "voboRequired">,
): boolean {
  if (settlement.status === "approved") return true;
  if (settlement.status === "draft" && settlement.voboRequired === false) {
    return true;
  }
  return false;
}

export function isSettlementDisbursable(input: {
  settlement: Pick<DriverSettlement, "status" | "voboRequired">;
  canExecute: boolean;
}): boolean {
  if (!input.canExecute) return false;
  return isSettlementAwaitingDisbursement(input.settlement);
}

export function canDisburse(input: {
  settlement: Pick<DriverSettlement, "status" | "voboRequired">;
  canExecute: boolean;
  selfActionUi: SelfActionUi;
}): boolean {
  return isSettlementDisbursable(input) && input.selfActionUi !== "blocked_own";
}

export function canSubmitVobo(input: {
  settlement: Pick<DriverSettlement, "status" | "voboRequired">;
  canUpdate: boolean;
}): boolean {
  if (!input.canUpdate) return false;
  if (input.settlement.status !== "draft") return false;
  return input.settlement.voboRequired !== false;
}
