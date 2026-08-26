import { describe, expect, it, vi } from "vitest";
import {
  clearTenantQueryCache,
  isPlatformQueryKey,
} from "./clearTenantQueryCache";

describe("isPlatformQueryKey", () => {
  it("detects platform prefix", () => {
    expect(isPlatformQueryKey(["platform"])).toBe(true);
    expect(isPlatformQueryKey(["platform", "metrics"])).toBe(true);
    expect(isPlatformQueryKey(["trips"])).toBe(false);
    expect(isPlatformQueryKey([])).toBe(false);
  });
});

describe("clearTenantQueryCache", () => {
  it("removes only non-platform queries", () => {
    const removeQueries = vi.fn();
    const queryClient = { removeQueries } as never;

    clearTenantQueryCache(queryClient);

    expect(removeQueries).toHaveBeenCalledTimes(1);
    const { predicate } = removeQueries.mock.calls[0][0] as {
      predicate: (q: { queryKey: unknown[] }) => boolean;
    };
    expect(predicate({ queryKey: ["platform", "metrics"] })).toBe(false);
    expect(predicate({ queryKey: ["trips", "list"] })).toBe(true);
  });
});
