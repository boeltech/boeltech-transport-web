/**
 * Login MFA challenge UX — clear burned/expired challenge (ADR-0070 H3).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "@shared/api/interceptors/error-handler";

const login = vi.fn();
const verifyMfaLogin = vi.fn();

vi.mock("@features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/auth")>();
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      login: (...args: unknown[]) => login(...args),
      verifyMfaLogin: (...args: unknown[]) => verifyMfaLogin(...args),
    },
  };
});

vi.mock("@shared/ui/turnstile", () => ({
  isTurnstileConfigured: () => false,
  TurnstileWidget: () => null,
}));

vi.mock("@shared/commercial/usePublicSelfServeRegister", () => ({
  usePublicSelfServeRegister: () => ({ open: false }),
}));

import LoginPage from "./LoginPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage MFA challenge clear", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    login.mockResolvedValue({
      needsMfa: true,
      mfaChallengeToken: "chal-1",
      mfaChallengeExpiresAt: new Date().toISOString(),
    });
  });

  async function reachMfaStep(user: ReturnType<typeof userEvent.setup>) {
    renderPage();
    await user.type(screen.getByLabelText(/Empresa/i), "acme");
    await user.type(screen.getByLabelText(/Correo electrónico/i), "a@b.com");
    await user.type(screen.getByLabelText(/^Contraseña$/i), "password1");
    await user.click(screen.getByRole("button", { name: /^Entrar$/i }));
    await screen.findByText(/Verificación en dos pasos/i);
  }

  it("clears MFA step on MFA_CHALLENGE_EXPIRED", async () => {
    const user = userEvent.setup();
    verifyMfaLogin.mockRejectedValue(
      new ApiError(
        "El desafío MFA expiró o ya fue usado",
        401,
        "MFA_CHALLENGE_EXPIRED",
      ),
    );

    await reachMfaStep(user);
    await user.type(screen.getByLabelText(/^Código$/i), "123456");
    await user.click(screen.getByRole("button", { name: /^Verificar$/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/Verificación en dos pasos/i),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /^Entrar$/i })).toBeInTheDocument();
  });

  it("keeps MFA step on MFA_INVALID", async () => {
    const user = userEvent.setup();
    verifyMfaLogin.mockRejectedValue(
      new ApiError("Código MFA inválido", 401, "MFA_INVALID"),
    );

    await reachMfaStep(user);
    await user.type(screen.getByLabelText(/^Código$/i), "000000");
    await user.click(screen.getByRole("button", { name: /^Verificar$/i }));

    await waitFor(() => {
      expect(verifyMfaLogin).toHaveBeenCalled();
    });
    expect(screen.getByText(/Verificación en dos pasos/i)).toBeInTheDocument();
  });
});
