import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getChartPrimaryColor,
  MAPBOX_CHART_PRIMARY_FALLBACK,
} from "./mapboxThemeColors";

describe("mapboxThemeColors", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses Patio brand teal fallback (not v1 hue 250)", () => {
    expect(MAPBOX_CHART_PRIMARY_FALLBACK).toBe("oklch(0.54 0.13 205)");
    expect(MAPBOX_CHART_PRIMARY_FALLBACK).not.toMatch(/250/);
  });

  it("returns fallback when document is unavailable (SSR / node)", () => {
    expect(typeof document === "undefined").toBe(true);
    expect(getChartPrimaryColor()).toBe(MAPBOX_CHART_PRIMARY_FALLBACK);
  });

  it("returns CSS --chart-1 when available", () => {
    vi.stubGlobal("document", { documentElement: {} });
    vi.stubGlobal("getComputedStyle", () => ({
      getPropertyValue: (prop: string) =>
        prop === "--chart-1" ? "  oklch(0.60 0.135 205)  " : "",
    }));

    expect(getChartPrimaryColor()).toBe("oklch(0.60 0.135 205)");
  });

  it("falls back to Patio brand when --chart-1 is empty", () => {
    vi.stubGlobal("document", { documentElement: {} });
    vi.stubGlobal("getComputedStyle", () => ({
      getPropertyValue: () => "   ",
    }));

    expect(getChartPrimaryColor()).toBe(MAPBOX_CHART_PRIMARY_FALLBACK);
  });
});
