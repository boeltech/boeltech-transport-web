import { describe, expect, it } from "vitest";
import {
  cycleThemeMode,
  parseStoredThemeMode,
  resolveThemeMode,
  THEME_DEFAULT_MODE,
  THEME_MODE_CYCLE,
  THEME_STORAGE_KEY,
} from "./themeRuntime";

describe("themeRuntime", () => {
  it("exports stable storage constants", () => {
    expect(THEME_STORAGE_KEY).toBe("boeltech-theme");
    expect(THEME_DEFAULT_MODE).toBe("system");
  });

  it("resolveThemeMode returns explicit modes", () => {
    expect(resolveThemeMode("dark", false)).toBe("dark");
    expect(resolveThemeMode("light", true)).toBe("light");
  });

  it("resolveThemeMode follows system preference", () => {
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode("system", false)).toBe("light");
  });

  it("parseStoredThemeMode accepts valid modes only", () => {
    expect(parseStoredThemeMode("system")).toBe("system");
    expect(parseStoredThemeMode("dark")).toBe("dark");
    expect(parseStoredThemeMode("light")).toBe("light");
    expect(parseStoredThemeMode("invalid")).toBeNull();
    expect(parseStoredThemeMode(null)).toBeNull();
  });

  it("cycleThemeMode rotates system → light → dark → system", () => {
    expect(THEME_MODE_CYCLE).toEqual(["system", "light", "dark"]);
    expect(cycleThemeMode("system")).toBe("light");
    expect(cycleThemeMode("light")).toBe("dark");
    expect(cycleThemeMode("dark")).toBe("system");
  });

  it("cycleThemeMode falls back to system for invalid mode", () => {
    expect(cycleThemeMode("invalid" as "light")).toBe("system");
  });
});
