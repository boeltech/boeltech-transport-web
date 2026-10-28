import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../opsTokens.css";
import { opsCopy } from "../opsCopy";
import {
  OPS_THEME_STORAGE_KEY,
  type OpsThemeMode,
} from "../opsTheme";
import { OpsThemeProvider } from "../OpsThemeProvider";
import { OpsPortalHost } from "./opsPortal";
import { OpsThemeToggle } from "./OpsThemeToggle";

function wrap(ui: ReactNode) {
  return render(
    <div className="platform-ops" data-ops-theme="dark">
      <OpsThemeProvider>{ui}</OpsThemeProvider>
    </div>,
  );
}

describe("OpsThemeToggle (L1 LID-D4)", () => {
  beforeEach(() => {
    localStorage.removeItem(OPS_THEME_STORAGE_KEY);
  });

  it("opens menu with Sistema / Claro / Oscuro and persists selection", async () => {
    const user = userEvent.setup();
    wrap(<OpsThemeToggle />);

    await user.click(
      screen.getByRole("button", { name: opsCopy.theme.trigger }),
    );
    expect(screen.getByTestId("ops-theme-menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: opsCopy.theme.system }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: opsCopy.theme.light }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemradio", { name: opsCopy.theme.dark }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("menuitemradio", { name: opsCopy.theme.light }),
    );
    expect(localStorage.getItem(OPS_THEME_STORAGE_KEY)).toBe(
      "light" satisfies OpsThemeMode,
    );
    expect(screen.queryByTestId("ops-theme-menu")).not.toBeInTheDocument();
  });

  it("portals the menu, ticks the choice, and returns focus with Escape", async () => {
    const user = userEvent.setup();
    render(
      <div className="platform-ops" data-ops-theme="dark">
        <OpsThemeProvider>
          <OpsPortalHost>
            <OpsThemeToggle />
          </OpsPortalHost>
        </OpsThemeProvider>
      </div>,
    );

    const trigger = screen.getByRole("button", {
      name: opsCopy.theme.trigger,
    });
    await user.click(trigger);

    const menu = screen.getByTestId("ops-theme-menu");
    expect(screen.getByTestId("ops-portal-root").contains(menu)).toBe(true);
    const selected = screen.getByRole("menuitemradio", {
      name: opsCopy.theme.system,
    });
    expect(selected).toHaveAttribute("aria-checked", "true");
    expect(selected.className).not.toMatch(/ops-bg-surface/);

    await user.keyboard("{ArrowDown}");
    expect(
      screen.getByRole("menuitemradio", { name: opsCopy.theme.light }),
    ).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("ops-theme-menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
