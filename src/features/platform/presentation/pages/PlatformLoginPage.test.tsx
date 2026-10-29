import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PlatformLoginPage } from "./PlatformLoginPage";
import { platformCopy } from "../copy/platformCopy";
import { opsCopy } from "../ops/opsCopy";
import { PLATFORM_CONSOLE_FAVICON_HREF } from "../layout/usePlatformDocumentChrome";

vi.mock("../../infrastructure/platformTokenStorage", () => ({
  platformTokenStorage: {
    hasSession: () => false,
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setUser: vi.fn(),
  },
  markPlatformFreshLoginSession: vi.fn(),
}));

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    login: vi.fn(),
    verifyMfaLogin: vi.fn(),
  },
}));

describe("PlatformLoginPage (Ops)", () => {
  beforeEach(() => {
    document.title = "tlamx";
  });

  it("wraps login in .platform-ops with BrandMark hero, theme, no ThemeToggle", () => {
    renderWithTheme(<PlatformLoginPage />, { route: ["/platform/login"] });

    const root = screen.getByTestId("platform-ops-login");
    expect(root).toHaveClass("platform-ops");
    expect(root).toHaveAttribute("data-ops-login", "true");
    expect(root).toHaveAttribute("data-ops-theme");

    const brand = screen.getByTestId("ops-brand-mark");
    expect(brand).toHaveAttribute("data-ops-brand", "hero");
    expect(brand).toHaveTextContent(opsCopy.monogram);
    expect(brand).toHaveTextContent(opsCopy.wordmark);
    expect(document.querySelector("svg.lucide-shield")).toBeNull();
    expect(screen.queryByTestId("ops-theme-toggle")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: opsCopy.theme.trigger }),
    ).not.toBeInTheDocument();

    const panel = screen.getByTestId("ops-panel");
    expect(panel).toBeInTheDocument();
    expect(panel).not.toHaveTextContent(platformCopy.brand.name);
    expect(panel).not.toHaveTextContent(opsCopy.wordmark);
    expect(screen.getByText(platformCopy.brand.subtitle)).toBeInTheDocument();
    expect(screen.getByText(platformCopy.login.description)).toBeInTheDocument();
    expect(screen.queryByText(platformCopy.login.title)).not.toBeInTheDocument();

    expect(document.title).toBe(opsCopy.wordmark);
    expect(
      document.querySelector('link[rel="icon"]')?.getAttribute("href"),
    ).toBe(PLATFORM_CONSOLE_FAVICON_HREF);

    expect(screen.getByLabelText(platformCopy.login.emailLabel)).toHaveAttribute(
      "data-ops-input",
      "",
    );
    expect(
      screen.getByRole("button", { name: platformCopy.login.submit }),
    ).toHaveAttribute("data-ops-button", "primary");
    expect(
      screen.getByRole("button", { name: platformCopy.login.showPassword }),
    ).toBeInTheDocument();
  });

  it("shows OpsFormErrors (not ERP Alert) after failed client validation", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PlatformLoginPage />, { route: ["/platform/login"] });

    await user.click(
      screen.getByRole("button", { name: platformCopy.login.submit }),
    );

    expect(
      await screen.findByText(platformCopy.login.validationSummaryTitle),
    ).toBeInTheDocument();
    expect(document.querySelector(".ops-form-errors")).not.toBeNull();
    expect(document.querySelector('[data-slot="alert"]')).toBeNull();
    expect(document.querySelector(".bg-destructive")).toBeNull();
  });
});
