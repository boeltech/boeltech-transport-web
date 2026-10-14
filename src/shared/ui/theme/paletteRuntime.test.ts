import { describe, expect, it } from "vitest";
import {
  COLOR_PALETTE_CYCLE,
  COLOR_PALETTE_DEFAULT,
  COLOR_PALETTE_META,
  COLOR_PALETTE_STORAGE_KEY,
  cycleColorPalette,
  parseStoredColorPalette,
} from "./paletteRuntime";

describe("paletteRuntime", () => {
  it("exports stable storage defaults", () => {
    expect(COLOR_PALETTE_STORAGE_KEY).toBe("boeltech-palette");
    expect(COLOR_PALETTE_DEFAULT).toBe("v2");
    expect(COLOR_PALETTE_CYCLE).toEqual(["v1", "v2"]);
  });

  it("parseStoredColorPalette accepts v1/v2 only", () => {
    expect(parseStoredColorPalette("v1")).toBe("v1");
    expect(parseStoredColorPalette("v2")).toBe("v2");
    expect(parseStoredColorPalette("v3")).toBeNull();
    expect(parseStoredColorPalette(null)).toBeNull();
  });

  it("cycleColorPalette toggles v1 ↔ v2", () => {
    expect(cycleColorPalette("v1")).toBe("v2");
    expect(cycleColorPalette("v2")).toBe("v1");
  });

  it("exposes human labels for DS switcher", () => {
    expect(COLOR_PALETTE_META.v1.label).toMatch(/azul/i);
    expect(COLOR_PALETTE_META.v2.label).toMatch(/patio|ink|ámbar/i);
    expect(COLOR_PALETTE_META.v2.description).toMatch(/teal|brand/i);
    expect(COLOR_PALETTE_META.v2.description).not.toMatch(/blueprint/i);
  });
});
