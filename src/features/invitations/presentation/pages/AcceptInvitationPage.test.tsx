/**
 * Accept invitation F1 — StatusBlock + password a11y (paridad reset); sin auto-nav.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const useVerifyInvitation = vi.fn();

vi.mock("../../application/hooks/useVerifyInvitation", () => ({
  useVerifyInvitation: (...args: unknown[]) => useVerifyInvitation(...args),
}));

vi.mock("../../infrastructure/invitationsApi", () => ({
  invitationsApi: {
    accept: vi.fn(),
    verify: vi.fn(),
  },
}));

import { AcceptInvitationPage } from "./AcceptInvitationPage";
import { acceptInvitationCopy as copy } from "../copy/acceptInvitationCopy";
import { invitationsApi } from "../../infrastructure/invitationsApi";
import { authFunnelCopy } from "@pages/auth/authFunnelCopy";

const mockedAccept = vi.mocked(invitationsApi.accept);

function renderPage(search = "?token=abc") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/accept-invitation${search}`]}>
        <Routes>
          <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AcceptInvitationPage F1", () => {
  beforeEach(() => {
    useVerifyInvitation.mockReset();
    mockedAccept.mockReset();
  });

  it("shows StatusBlock loading while verifying", () => {
    useVerifyInvitation.mockReturnValue({
      isLoading: true,
      isMissingToken: false,
      isValid: false,
      data: undefined,
      errorMessage: null,
    });
    renderPage();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(copy.loading)).toBeInTheDocument();
  });

  it("shows StatusBlock error with outline login when invalid", () => {
    useVerifyInvitation.mockReturnValue({
      isLoading: false,
      isMissingToken: true,
      isValid: false,
      data: undefined,
      errorMessage: copy.invalid.missingToken,
    });
    renderPage("?");
    expect(
      screen.getByRole("heading", { name: copy.invalid.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.invalid.goLogin }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows form with password visibility toggles and requirements", () => {
    useVerifyInvitation.mockReturnValue({
      isLoading: false,
      isMissingToken: false,
      isValid: true,
      data: {
        valid: true,
        email: "ops@empresa.mx",
        role: "dispatcher",
        tenantName: "Acme Transport",
        firstName: "Ana",
        lastName: "Pérez",
      },
      errorMessage: null,
    });
    renderPage();
    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: authFunnelCopy.showPassword }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: copy.backToLogin }),
    ).toHaveAttribute("href", "/login");
  });

  it("success: CTA to login with subdomain; does not auto-navigate", async () => {
    const user = userEvent.setup();
    useVerifyInvitation.mockReturnValue({
      isLoading: false,
      isMissingToken: false,
      isValid: true,
      data: {
        valid: true,
        email: "ops@empresa.mx",
        role: "dispatcher",
        tenantName: "Acme Transport",
        firstName: "Ana",
        lastName: "Pérez",
      },
      errorMessage: null,
    });
    mockedAccept.mockResolvedValue({
      message: "OK",
      data: { userId: "u1", tenantSubdomain: "acme" },
    });

    renderPage("?token=good");

    await user.clear(screen.getByLabelText(copy.fields.password));
    await user.type(
      screen.getByLabelText(copy.fields.password),
      "SecurePass1!",
    );
    await user.type(
      screen.getByLabelText(copy.fields.confirmPassword),
      "SecurePass1!",
    );
    await user.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: copy.success.title }),
      ).toBeInTheDocument();
    });

    const loginLink = screen.getByRole("link", { name: copy.success.goLogin });
    expect(loginLink).toHaveAttribute("href", "/login?subdomain=acme");
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});
