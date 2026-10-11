import type { FinanceRepWaitReason } from "@features/finance/domain";

export type CobrosRepStage =
  | "queued"
  | "stamping"
  | "ready"
  | "needs_action";

export function resolveCobrosRepStage(input: {
  readonly repStatus: string;
  readonly waitReason?: FinanceRepWaitReason | string | null;
}): CobrosRepStage {
  const { repStatus, waitReason } = input;
  if (repStatus === "stamped") return "ready";
  if (repStatus === "failed" || repStatus === "cancelled") return "needs_action";
  if (waitReason === "queued") return "queued";
  if (
    waitReason === "retry_scheduled" ||
    waitReason === "blocked_by_prior" ||
    waitReason === "pac_clock" ||
    waitReason === "quota"
  ) {
    return "stamping";
  }
  if (waitReason === "manual_review") return "needs_action";
  if (
    repStatus === "pending" ||
    repStatus === "restamp_pending" ||
    repStatus === "cancelling"
  ) {
    return waitReason == null ? "queued" : "stamping";
  }
  return "queued";
}
