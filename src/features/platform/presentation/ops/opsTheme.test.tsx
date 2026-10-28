import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getInitialOpsResolvedTheme,
  getInitialOpsThemeMode,
  OPS_THEME_DEFAULT_MODE,
  OPS_THEME_STORAGE_KEY,
  parseOpsThemeMode,
  resolveOpsTheme,
  writeStoredOpsThemeMode,
} from "./opsTheme";

describe("opsTheme", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("exports Ops storage key distinct from ERP", () => {
    expect(OPS_THEME_STORAGE_KEY).toBe("boeltech-ops-theme");
    expect(OPS_THEME_DEFAULT_MODE).toBe("system");
  });

  it("resolveOpsTheme returns explicit modes", () => {
    expect(resolveOpsTheme("dark", false)).toBe("dark");
    expect(resolveOpsTheme("light", true)).toBe("light");
  });

  it("resolveOpsTheme follows system preference", () => {
    expect(resolveOpsTheme("system", true)).toBe("dark");
    expect(resolveOpsTheme("system", false)).toBe("light");
  });

  it("parseOpsThemeMode accepts valid modes only", () => {
    expect(parseOpsThemeMode("system")).toBe("system");
    expect(parseOpsThemeMode("dark")).toBe("dark");
    expect(parseOpsThemeMode("light")).toBe("light");
    expect(parseOpsThemeMode("invalid")).toBeNull();
    expect(parseOpsThemeMode(null)).toBeNull();
  });

  it("getInitialOpsResolvedTheme is sync from storage + matchMedia", () => {
    writeStoredOpsThemeMode("light");
    expect(localStorage.getItem(OPS_THEME_STORAGE_KEY)).toBe("light");
    expect(getInitialOpsThemeMode()).toBe("light");
    expect(getInitialOpsResolvedTheme()).toBe("light");

    writeStoredOpsThemeMode("system");
    expect(localStorage.getItem(OPS_THEME_STORAGE_KEY)).toBe("system");
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        media: "(prefers-color-scheme: dark)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }),
    );
    expect(getInitialOpsResolvedTheme()).toBe("dark");
  });
});
