import { describe, expect, it } from "vitest";
import {
  computeStampUsagePercent,
  getStampUsageAlertVariant,
  resolveStampUsageAlertLevel,
} from "./stampUsageThresholds";

describe("computeStampUsagePercent", () => {
  it("returns 0 when included is 0", () => {
    expect(computeStampUsagePercent(10, 0)).toBe(0);
  });

  it("caps at 100 when over included", () => {
    expect(computeStampUsagePercent(400, 380)).toBe(100);
  });

  it("rounds percentage", () => {
    expect(computeStampUsagePercent(266, 380)).toBe(70);
  });
});

describe("resolveStampUsageAlertLevel", () => {
  it.each([
    [0, "none"],
    [69, "none"],
    [70, "watch"],
    [79, "watch"],
    [80, "warning"],
    [99, "warning"],
    [100, "exhausted"],
  ] as const)("%i%% → %s", (percent, level) => {
    expect(resolveStampUsageAlertLevel(percent)).toBe(level);
  });
});

describe("getStampUsageAlertVariant", () => {
  it("maps levels to alert variants", () => {
    expect(getStampUsageAlertVariant("none")).toBeNull();
    expect(getStampUsageAlertVariant("watch")).toBe("info");
    expect(getStampUsageAlertVariant("warning")).toBe("warning");
    expect(getStampUsageAlertVariant("exhausted")).toBe("destructive");
  });
});
