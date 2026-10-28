import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { opsCopy } from "./opsCopy";
import { OpsThemeProvider } from "./OpsThemeProvider";
import { PlatformOpsTopbar } from "./PlatformOpsTopbar";
import "./opsTokens.css";

const authState = vi.hoisted(() => ({
  platformRole: "platform_owner" as "platform_owner" | "platform_support",
}));

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: () => ({
    user: {
      id: "u1",
      email: "owner@test.com",
      firstName: "Owner",
      lastName: "Test",
      platformRole: authState.platformRole,
      scope: "platform" as const,
      mfaEnabled: true,
    },
  }),
}));

describe("PlatformOpsTopbar (L1 ThemeToggle)", () => {
  beforeEach(() => {
    authState.platformRole = "platform_owner";
  });

  it("mounts OpsThemeToggle in the banner", () => {
    renderWithTheme(
      <div className="platform-ops" data-ops-theme="dark">
        <OpsThemeProvider>
          <PlatformOpsTopbar onOpenCommand={vi.fn()} />
        </OpsThemeProvider>
      </div>,
    );

    expect(screen.getByTestId("platform-ops-topbar")).toBeInTheDocument();
    expect(screen.getByTestId("ops-theme-toggle")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: opsCopy.theme.trigger }),
    ).toBeInTheDocument();
  });

  it("exposes hairline search trigger (F1 chrome)", () => {
    renderWithTheme(
      <div className="platform-ops" data-ops-theme="light">
        <OpsThemeProvider>
          <PlatformOpsTopbar onOpenCommand={vi.fn()} />
        </OpsThemeProvider>
      </div>,
    );

    const search = screen.getByTestId("ops-topbar-search");
    expect(search).toHaveClass("ops-topbar-search");
    expect(search).toHaveAttribute("aria-label", opsCopy.cmdk.trigger);
  });

  it("shows platform_owner in mono and drops the Consola badge", () => {
    renderWithTheme(
      <div className="platform-ops" data-ops-theme="dark">
        <OpsThemeProvider>
          <PlatformOpsTopbar onOpenCommand={vi.fn()} />
        </OpsThemeProvider>
      </div>,
    );

    const mark = screen.getByTestId("ops-operator-mark");
    expect(mark.tagName).toBe("SPAN");
    expect(mark).toHaveTextContent("platform_owner");
    expect(mark).toHaveClass("ops-font-mono", "ops-text");
    expect(mark.closest("button")).toBeNull();
    expect(screen.queryByText(opsCopy.envLabel)).not.toBeInTheDocument();
  });

  it("shows platform_support in muted text that is not a control", () => {
    authState.platformRole = "platform_support";
    renderWithTheme(
      <div className="platform-ops" data-ops-theme="dark">
        <OpsThemeProvider>
          <PlatformOpsTopbar onOpenCommand={vi.fn()} />
        </OpsThemeProvider>
      </div>,
    );

    const mark = screen.getByTestId("ops-operator-mark");
    expect(mark).toHaveTextContent("platform_support");
    expect(mark).toHaveClass("ops-text-muted");
    expect(mark.closest("button")).toBeNull();
  });
});
