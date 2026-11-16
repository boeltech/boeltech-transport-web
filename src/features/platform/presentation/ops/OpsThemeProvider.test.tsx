import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import {
  OpsThemeProvider,
  useOpsTheme,
} from "./OpsThemeProvider";
import {
  clearOpsThemeBridge,
  getOpsThemeBridge,
} from "./opsThemeBridge";
import {
  OPS_DOCUMENT_CANVAS_BG,
  OPS_THEME_STORAGE_KEY,
} from "./opsTheme";

function Probe() {
  const { mode, resolved, setMode } = useOpsTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolved}</span>
      <button type="button" onClick={() => setMode("light")}>
        light
      </button>
      <button type="button" onClick={() => setMode("dark")}>
        dark
      </button>
    </div>
  );
}

describe("OpsThemeProvider", () => {
  afterEach(() => {
    localStorage.clear();
    clearOpsThemeBridge();
    vi.unstubAllGlobals();
  });

  it("defaults to system and registers bridge with resolved theme", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(
      <OpsThemeProvider>
        <Probe />
      </OpsThemeProvider>,
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(getOpsThemeBridge()).toBe("light");
  });

  it("persists mode under Ops storage key and updates bridge", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(
      <OpsThemeProvider>
        <Probe />
      </OpsThemeProvider>,
    );

    act(() => {
      screen.getByRole("button", { name: "light" }).click();
    });

    expect(screen.getByTestId("mode")).toHaveTextContent("light");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(localStorage.getItem(OPS_THEME_STORAGE_KEY)).toBe("light");
    expect(getOpsThemeBridge()).toBe("light");

    act(() => {
      screen.getByRole("button", { name: "dark" }).click();
    });
    expect(getOpsThemeBridge()).toBe("dark");
  });

  it("clears bridge on unmount", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    const { unmount } = render(
      <OpsThemeProvider>
        <Probe />
      </OpsThemeProvider>,
    );
    expect(getOpsThemeBridge()).toBe("light");
    unmount();
    expect(getOpsThemeBridge()).toBeNull();
  });

  it("syncs document color-scheme and body canvas (H-P01-D04)", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    window.history.pushState({}, "", "/");

    const { unmount } = render(
      <OpsThemeProvider>
        <Probe />
      </OpsThemeProvider>,
    );

    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.body.style.backgroundColor).toBe(
      OPS_DOCUMENT_CANVAS_BG.light,
    );

    act(() => {
      screen.getByRole("button", { name: "dark" }).click();
    });
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.body.style.backgroundColor).toBe(
      OPS_DOCUMENT_CANVAS_BG.dark,
    );

    unmount();
    expect(document.documentElement.style.colorScheme).toBe("");
    expect(document.body.style.backgroundColor).toBe("");
  });

  it("keeps document surface when unmounting while still under /platform", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    window.history.pushState({}, "", "/platform/login");

    const { unmount } = render(
      <OpsThemeProvider>
        <Probe />
      </OpsThemeProvider>,
    );
    act(() => {
      screen.getByRole("button", { name: "dark" }).click();
    });
    unmount();
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.body.style.backgroundColor).toBe(
      OPS_DOCUMENT_CANVAS_BG.dark,
    );

    window.history.pushState({}, "", "/");
    document.documentElement.style.colorScheme = "";
    document.body.style.backgroundColor = "";
  });
});
