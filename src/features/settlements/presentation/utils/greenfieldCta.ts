import { DEFAULT_VOBO_THRESHOLD_MXN } from "../../domain/enums";
import type { DriverSettlement } from "../../domain/entities";

/**
 * Display gating aligned with API #32 `isVoboRequired`.
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

export type GreenfieldCreateCta = "pedir_vobo" | "guardar_borrador";

export function resolveGreenfieldCreateCta(input: {
  netAmount: number;
  hasManualAdjustments: boolean;
  thresholdMxn?: number;
}): GreenfieldCreateCta {
  return isVoboRequiredForPreview(input) ? "pedir_vobo" : "guardar_borrador";
}

export function isSettlementMaker(
  settlement: Pick<DriverSettlement, "createdBy" | "submittedBy">,
  userId: string | null | undefined,
): boolean {
  if (!userId) return false;
  return settlement.createdBy === userId || settlement.submittedBy === userId;
}

export function canDisburseGreenfield(input: {
  settlement: Pick<
    DriverSettlement,
    "status" | "voboRequired" | "createdBy" | "submittedBy"
  >;
  userId: string | null | undefined;
  canExecute: boolean;
}): boolean {
  if (!input.canExecute) return false;
  if (isSettlementMaker(input.settlement, input.userId)) return false;

  const { status, voboRequired } = input.settlement;
  if (status === "approved") return true;
  if (status === "draft" && voboRequired === false) return true;
  return false;
}

export function canSubmitGreenfieldVobo(input: {
  settlement: Pick<DriverSettlement, "status" | "voboRequired">;
  canUpdate: boolean;
}): boolean {
  if (!input.canUpdate) return false;
  if (input.settlement.status !== "draft") return false;
  return input.settlement.voboRequired !== false;
}
