import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearOpsThemeBridge,
  getOpsThemeBridge,
  registerOpsThemeBridge,
  subscribeOpsThemeBridge,
} from "./opsThemeBridge";

describe("opsThemeBridge", () => {
  afterEach(() => {
    clearOpsThemeBridge();
  });

  it("register / clear and notify subscribers", () => {
    const listener = vi.fn();
    const unsub = subscribeOpsThemeBridge(listener);

    registerOpsThemeBridge("dark");
    expect(getOpsThemeBridge()).toBe("dark");
    expect(listener).toHaveBeenCalledTimes(1);

    clearOpsThemeBridge();
    expect(getOpsThemeBridge()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
    registerOpsThemeBridge("light");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
