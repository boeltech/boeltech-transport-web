import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isPlatformRefreshInFlight,
  resetPlatformRefreshCoordinator,
  runPlatformRefresh,
} from "./platformRefreshCoordinator";

describe("platformRefreshCoordinator", () => {
  afterEach(() => {
    resetPlatformRefreshCoordinator();
  });

  it("dedupes concurrent refresh factories into one execution", async () => {
    let calls = 0;
    const factory = vi.fn(async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return { accessToken: "at-1", refreshToken: "rt-1" };
    });

    const [a, b] = await Promise.all([
      runPlatformRefresh(factory),
      runPlatformRefresh(factory),
    ]);

    expect(calls).toBe(1);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ accessToken: "at-1", refreshToken: "rt-1" });
    expect(b).toEqual({ accessToken: "at-1", refreshToken: "rt-1" });
    expect(isPlatformRefreshInFlight()).toBe(false);
  });

  it("allows a new refresh after the previous settles", async () => {
    const first = await runPlatformRefresh(async () => ({
      accessToken: "a1",
      refreshToken: "r1",
    }));
    const second = await runPlatformRefresh(async () => ({
      accessToken: "a2",
      refreshToken: "r2",
    }));
    expect(first.accessToken).toBe("a1");
    expect(second.accessToken).toBe("a2");
  });
});
