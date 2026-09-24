import { describe, expect, it } from "vitest";
import {
  healthToneDotClass,
  resolvePlatformHealthTone,
} from "./platformHealthTone";

describe("platformHealthTone", () => {
  it("maps null to unknown (R1 — no at-risk by missing score)", () => {
    expect(resolvePlatformHealthTone(null)).toBe("unknown");
    expect(resolvePlatformHealthTone(undefined)).toBe("unknown");
  });

  it("maps score bands for display dots", () => {
    expect(resolvePlatformHealthTone(39)).toBe("risk");
    expect(resolvePlatformHealthTone(40)).toBe("watch");
    expect(resolvePlatformHealthTone(69)).toBe("watch");
    expect(resolvePlatformHealthTone(70)).toBe("healthy");
  });

  it("returns CSS classes for each tone", () => {
    expect(healthToneDotClass("healthy")).toContain("success");
    expect(healthToneDotClass("watch")).toContain("warning");
    expect(healthToneDotClass("risk")).toContain("destructive");
    expect(healthToneDotClass("unknown")).toContain("muted");
  });
});
