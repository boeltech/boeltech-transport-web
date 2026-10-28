import { describe, expect, it } from "vitest";
import type { PlatformPulseAttentionItem } from "../../domain/entities";
import { filterHoyQueue, pickHoyLandingQueue } from "./hoyQueues";

function item(
  partial: Partial<PlatformPulseAttentionItem>,
): PlatformPulseAttentionItem {
  return {
    tenantId: "t1",
    name: "Acme",
    subdomain: "acme",
    lifecycleStage: "active",
    healthScore: 80,
    reasonCodes: [],
    cxcOverdueCents: 0,
    subscriptionStatus: "active",
    accessStatus: "active",
    ...partial,
  };
}

describe("filterHoyQueue", () => {
  const items = [
    item({
      tenantId: "a",
      lifecycleStage: "provisioning",
    }),
    item({
      tenantId: "b",
      lifecycleStage: "trialing",
      reasonCodes: ["trial_ending"],
      subscriptionStatus: "trialing",
    }),
    item({
      tenantId: "c",
      subscriptionStatus: "past_due",
      reasonCodes: ["past_due"],
      cxcOverdueCents: 1000,
    }),
    item({
      tenantId: "d",
      accessStatus: "suspended",
      lifecycleStage: "suspended",
      reasonCodes: ["suspended"],
    }),
  ];

  it("splits pulse attention into Hoy chips", () => {
    expect(filterHoyQueue(items, "activation").map((i) => i.tenantId)).toEqual([
      "a",
    ]);
    expect(filterHoyQueue(items, "trial").map((i) => i.tenantId)).toEqual([
      "b",
    ]);
    expect(filterHoyQueue(items, "past_due").map((i) => i.tenantId)).toEqual([
      "c",
    ]);
    expect(filterHoyQueue(items, "suspended").map((i) => i.tenantId)).toEqual([
      "d",
    ]);
  });

  it("lands on the first non-empty queue, past due before activation", () => {
    expect(
      pickHoyLandingQueue({
        past_due: 1,
        suspended: 2,
        activation: 3,
        trial: 4,
      }),
    ).toBe("past_due");
    expect(
      pickHoyLandingQueue({
        past_due: 0,
        suspended: 0,
        activation: 2,
        trial: 1,
      }),
    ).toBe("activation");
    expect(
      pickHoyLandingQueue({
        past_due: 0,
        suspended: 0,
        activation: 0,
        trial: 0,
      }),
    ).toBe("past_due");
  });
});
