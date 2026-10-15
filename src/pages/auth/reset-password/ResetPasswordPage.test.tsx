/**
 * Reset password F1 — StatusBlock states + ghost back-to-login (paridad forgot).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const useVerifyResetToken = vi.fn();

vi.mock("./useVerifyResetToken", () => ({
  useVerifyResetToken: (...args: unknown[]) => useVerifyResetToken(...args),
}));

vi.mock("@shared/api", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import ResetPasswordPage from "./ResetPasswordPage";
import { resetPasswordCopy as copy } from "./resetPasswordCopy";

function renderPage(search = "?token=abc") {
  return render(
    <MemoryRouter initialEntries={[`/reset-password${search}`]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ResetPasswordPage F1", () => {
  beforeEach(() => {
    useVerifyResetToken.mockReset();
  });

  it("shows StatusBlock loading while verifying the token", () => {
    useVerifyResetToken.mockReturnValue({
      isLoading: true,
      isMissingToken: false,
      result: undefined,
      errorMessage: null,
    });
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(copy.loading)).toBeInTheDocument();
  });

  it("shows form and ghost link to login when token is valid", () => {
    useVerifyResetToken.mockReturnValue({
      isLoading: false,
      isMissingToken: false,
      result: { valid: true },
      errorMessage: null,
    });
    renderPage();
    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.submit }),
    ).toBeInTheDocument();
    const back = screen.getByRole("link", { name: copy.backToLogin });
    expect(back).toHaveAttribute("href", "/login");
  });

  it("shows StatusBlock error with teal primary + outline login on invalid", () => {
    useVerifyResetToken.mockReturnValue({
      isLoading: false,
      isMissingToken: true,
      result: undefined,
      errorMessage: null,
    });
    renderPage("?");
    expect(
      screen.getByRole("heading", { name: copy.invalid.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.invalid.requestNew }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(
      screen.getByRole("link", { name: copy.invalid.backToLogin }),
    ).toHaveAttribute("href", "/login");
  });
});
