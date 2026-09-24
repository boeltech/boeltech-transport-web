import { describe, expect, it } from "vitest";
import { resolveDispatchPendingNote } from "./dispatchPendingNote";

describe("resolveDispatchPendingNote", () => {
  it("returns failed when lastItemStatus is failed", () => {
    expect(
      resolveDispatchPendingNote({
        enabledForClient: true,
        lastScheduledRunId: "run-1",
        lastItemStatus: "failed",
        lastError: "SMTP",
      }),
    ).toBe("failed");
  });

  it("returns auto_cutoff when enabled and not failed", () => {
    expect(
      resolveDispatchPendingNote({
        enabledForClient: true,
        lastScheduledRunId: null,
        lastItemStatus: null,
        lastError: null,
      }),
    ).toBe("auto_cutoff");
  });

  it("returns null when auto dispatch is absent or disabled", () => {
    expect(resolveDispatchPendingNote(null)).toBeNull();
    expect(resolveDispatchPendingNote(undefined)).toBeNull();
    expect(
      resolveDispatchPendingNote({
        enabledForClient: false,
        lastScheduledRunId: null,
        lastItemStatus: "sent",
        lastError: null,
      }),
    ).toBeNull();
  });
});
