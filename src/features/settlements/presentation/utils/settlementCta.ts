import { DEFAULT_VOBO_THRESHOLD_MXN } from "../../domain/enums";
import type { DriverSettlement } from "../../domain/entities";

/**
 * Display gating aligned with API `isVoboRequired`.
 * API remains the source of truth; this only picks CTAs before persist.
 */
export function isVoboRequiredForPreview(input: {
  netAmount: number;
  hasManualAdjustments: boolean;
  thresholdMxn?: number;
}): boolean {
  const threshold = input.thresholdMxn ?? DEFAULT_VOBO_THRESHOLD_MXN;
  if (input.hasManualAdjustments) return true;
  return input.netAmount >= threshold;
}

export type SettlementCreateCta = "pedir_vobo" | "guardar_borrador";

export function resolveCreateCta(input: {
  netAmount: number;
  hasManualAdjustments: boolean;
  thresholdMxn?: number;
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
  if (!userId) return false;
  return settlement.createdBy === userId || settlement.submittedBy === userId;
}

/** D3′: un solo autorizador activo puede autorizar/rechazar aunque sea maker. */
export function allowsMakerAsApprover(
  activeApproverCount: number | null | undefined,
): boolean {
  return activeApproverCount === 1;
}

/** D3′: un solo ejecutor activo puede registrar el pago aunque sea maker. */
export function allowsMakerAsExecutor(
  activeExecutorCount: number | null | undefined,
): boolean {
  return activeExecutorCount === 1;
}

export function canApproveSettlement(input: {
  settlement: Pick<DriverSettlement, "status" | "createdBy" | "submittedBy">;
  userId: string | null | undefined;
  canUpdate: boolean;
  activeApproverCount?: number | null;
}): boolean {
  if (!input.canUpdate) return false;
  if (input.settlement.status !== "pending_approval") return false;
  if (
    isSettlementMaker(input.settlement, input.userId) &&
    !allowsMakerAsApprover(input.activeApproverCount)
  ) {
    return false;
  }
  return true;
}

export function canRejectSettlement(input: {
  settlement: Pick<DriverSettlement, "status" | "createdBy" | "submittedBy">;
  userId: string | null | undefined;
  canUpdate: boolean;
  activeApproverCount?: number | null;
}): boolean {
  return canApproveSettlement(input);
}

export function canDisburse(input: {
  settlement: Pick<
    DriverSettlement,
    "status" | "voboRequired" | "createdBy" | "submittedBy"
  >;
  userId: string | null | undefined;
  canExecute: boolean;
  activeExecutorCount?: number | null;
}): boolean {
  if (!input.canExecute) return false;
  if (
    isSettlementMaker(input.settlement, input.userId) &&
    !allowsMakerAsExecutor(input.activeExecutorCount)
  ) {
    return false;
  }

  const { status, voboRequired } = input.settlement;
  if (status === "approved") return true;
  if (status === "draft" && voboRequired === false) return true;
  return false;
}

export function canSubmitVobo(input: {
  settlement: Pick<DriverSettlement, "status" | "voboRequired">;
  canUpdate: boolean;
}): boolean {
  if (!input.canUpdate) return false;
  if (input.settlement.status !== "draft") return false;
  return input.settlement.voboRequired !== false;
}
