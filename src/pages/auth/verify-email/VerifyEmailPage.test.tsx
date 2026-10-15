/**
 * Verify-email F1 — StatusBlock + login primero; panel solo con sesión local.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const useVerifyEmail = vi.fn();
const hasSession = vi.fn();

vi.mock("./useVerifyEmail", () => ({
  useVerifyEmail: (...args: unknown[]) => useVerifyEmail(...args),
}));

vi.mock("@features/auth/infrastructure", () => ({
  tokenStorage: {
    hasSession: () => hasSession(),
  },
}));

import VerifyEmailPage from "./VerifyEmailPage";
import { verifyEmailCopy as copy } from "./verifyEmailCopy";

function renderPage(search = "?token=abc") {
  return render(
    <MemoryRouter initialEntries={[`/verify-email${search}`]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("VerifyEmailPage F1", () => {
  beforeEach(() => {
    useVerifyEmail.mockReset();
    hasSession.mockReset();
    hasSession.mockReturnValue(false);
  });

  it("shows StatusBlock loading while verifying", () => {
    useVerifyEmail.mockReturnValue({
      isMissingToken: false,
      isLoading: true,
      isSuccess: false,
      isError: false,
      errorMessage: null,
    });
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(copy.loading)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: copy.success.title }),
    ).not.toBeInTheDocument();
  });

  it("success: primary CTA to login; no dashboard without session", () => {
    useVerifyEmail.mockReturnValue({
      isMissingToken: false,
      isLoading: false,
      isSuccess: true,
      isError: false,
      errorMessage: null,
    });
    hasSession.mockReturnValue(false);
    renderPage();
    expect(
      screen.getByRole("heading", { name: copy.success.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.success.goLogin }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.queryByRole("link", { name: copy.success.goDashboard }),
    ).not.toBeInTheDocument();
  });

  it("success: secondary dashboard CTA when local session exists", () => {
    useVerifyEmail.mockReturnValue({
      isMissingToken: false,
      isLoading: false,
      isSuccess: true,
      isError: false,
      errorMessage: null,
    });
    hasSession.mockReturnValue(true);
    renderPage();
    expect(
      screen.getByRole("link", { name: copy.success.goLogin }),
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("link", { name: copy.success.goDashboard }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("error: StatusBlock with outline login", () => {
    useVerifyEmail.mockReturnValue({
      isMissingToken: true,
      isLoading: false,
      isSuccess: false,
      isError: true,
      errorMessage: copy.error.missingToken,
    });
    renderPage("?");
    expect(
      screen.getByRole("heading", { name: copy.error.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.error.goLogin }),
    ).toHaveAttribute("href", "/login");
  });
});
