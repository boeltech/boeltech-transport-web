import { describe, expect, it, vi } from "vitest";
import { devRefetchIntervalFn, devRefetchIntervalMs } from "./devPolling";

describe("devPolling", () => {
  it("returns interval when polling is enabled", () => {
    expect(devRefetchIntervalMs(60_000)).toBe(60_000);
    expect(devRefetchIntervalMs(false)).toBe(false);
  });

  it("devRefetchIntervalFn delegates to resolver", () => {
    const resolver = vi.fn(() => 30_000 as const);
    const wrapped = devRefetchIntervalFn(resolver);
    const result = wrapped({ state: { data: { trip: { status: "in_progress" } } } });
    expect(resolver).toHaveBeenCalled();
    expect(result === 30_000 || result === false).toBe(true);
  });
});
