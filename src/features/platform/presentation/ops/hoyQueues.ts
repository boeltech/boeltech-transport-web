import type { PlatformPulseAttentionItem } from "../../domain/entities";

export type HoyQueueId = "activation" | "trial" | "past_due" | "suspended";

/** CMP-3: cobro pendiente, suspendidos, activar admin, trial. */
export const HOY_QUEUE_ORDER: readonly HoyQueueId[] = [
  "past_due",
  "suspended",
  "activation",
  "trial",
];

export function pickHoyLandingQueue(
  counts: Record<HoyQueueId, number>,
): HoyQueueId {
  for (const id of HOY_QUEUE_ORDER) {
    if (counts[id] > 0) return id;
  }
  return "past_due";
}

const ACTIVATION_STAGES = new Set(["prospect", "provisioning", "onboarding"]);

export function filterHoyQueue(
  items: PlatformPulseAttentionItem[],
  queue: HoyQueueId,
): PlatformPulseAttentionItem[] {
  switch (queue) {
    case "activation":
      return items.filter(
        (item) =>
          ACTIVATION_STAGES.has(item.lifecycleStage) ||
          item.reasonCodes.some((c) => c.includes("activation")),
      );
    case "trial":
      return items.filter(
        (item) =>
          item.lifecycleStage === "trialing" ||
          item.reasonCodes.includes("trial_ending") ||
          item.subscriptionStatus === "trialing",
      );
    case "past_due":
      return items.filter(
        (item) =>
          item.subscriptionStatus === "past_due" ||
          item.reasonCodes.includes("past_due") ||
          item.reasonCodes.includes("cxc_overdue") ||
          item.cxcOverdueCents > 0,
      );
    case "suspended":
      return items.filter(
        (item) =>
          item.accessStatus === "suspended" ||
          item.lifecycleStage === "suspended" ||
          item.reasonCodes.includes("suspended"),
      );
    default:
      return items;
  }
}
