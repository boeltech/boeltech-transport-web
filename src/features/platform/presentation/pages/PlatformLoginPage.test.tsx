import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PlatformLoginPage } from "./PlatformLoginPage";
import { platformCopy } from "../copy/platformCopy";
import { opsCopy } from "../ops/opsCopy";

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

describe("PlatformLoginPage (Ops L1 marca + tema)", () => {
  it("wraps login in .platform-ops with BrandMark hero, theme, no ThemeToggle", () => {
    renderWithTheme(<PlatformLoginPage />, { route: ["/platform/login"] });

    const root = screen.getByTestId("platform-ops-login");
    expect(root).toHaveClass("platform-ops");
    expect(root).toHaveAttribute("data-ops-login", "true");
    expect(root).toHaveAttribute("data-ops-theme");

    const brand = screen.getByTestId("ops-brand-mark");
    expect(brand).toHaveAttribute("data-ops-brand", "hero");
    expect(brand).toHaveTextContent(opsCopy.monogram);
    expect(document.querySelector("svg.lucide-shield")).toBeNull();
    expect(screen.queryByTestId("ops-theme-toggle")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: opsCopy.theme.trigger }),
    ).not.toBeInTheDocument();

    expect(screen.getByTestId("ops-panel")).toBeInTheDocument();
    expect(screen.getByLabelText(platformCopy.login.emailLabel)).toHaveAttribute(
      "data-ops-input",
      "",
    );
    expect(
      screen.getByRole("button", { name: platformCopy.login.submit }),
    ).toHaveAttribute("data-ops-button", "primary");
  });
});
