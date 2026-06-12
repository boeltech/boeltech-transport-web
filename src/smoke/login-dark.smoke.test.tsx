/**
 * Smoke dark — login shell legible con tokens semánticos.
 */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import LoginPage from "@/pages/auth/login/LoginPage";
import {
  expectNoRawTailwindColors,
  renderWithTheme,
} from "@/test/renderWithTheme";

describe("login dark smoke", () => {
  it("renders login form in dark theme with semantic surface classes", () => {
    const { container } = renderWithTheme(<LoginPage />, {
      resolvedTheme: "dark",
      route: ["/login"],
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expectNoRawTailwindColors(container);
  });
});
