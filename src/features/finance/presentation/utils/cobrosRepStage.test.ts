import { describe, expect, it } from "vitest";
import { resolveCobrosRepStage } from "./cobrosRepStage";

describe("resolveCobrosRepStage", () => {
  it("maps wait_reason and status to tray stages (no N de M facturas)", () => {
    expect(
      resolveCobrosRepStage({ repStatus: "pending", waitReason: "queued" }),
    ).toBe("queued");
    expect(
      resolveCobrosRepStage({
        repStatus: "pending",
        waitReason: "retry_scheduled",
      }),
    ).toBe("stamping");
    expect(
      resolveCobrosRepStage({
        repStatus: "pending",
        waitReason: "blocked_by_prior",
      }),
    ).toBe("stamping");
    expect(
      resolveCobrosRepStage({
        repStatus: "pending",
        waitReason: "pac_clock",
      }),
    ).toBe("stamping");
    expect(
      resolveCobrosRepStage({
        repStatus: "pending",
        waitReason: "quota",
      }),
    ).toBe("stamping");
    expect(resolveCobrosRepStage({ repStatus: "stamped" })).toBe("ready");
    expect(resolveCobrosRepStage({ repStatus: "failed" })).toBe("needs_action");
    expect(
      resolveCobrosRepStage({
        repStatus: "failed",
        waitReason: "manual_review",
      }),
    ).toBe("needs_action");
    expect(resolveCobrosRepStage({ repStatus: "pending" })).toBe("queued");
  });
});
