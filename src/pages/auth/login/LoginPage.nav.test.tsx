/**
 * Login ERP bounce + post-login `from` sanitization (Ola 9 — N9-2 / N9-3).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { UserJSON } from "@features/auth";

const login = vi.fn();
const verifyMfaLogin = vi.fn();
const hasSession = vi.fn(() => false);
const getUser = vi.fn(() => null as UserJSON | null);
const setToken = vi.fn();
const setRefreshToken = vi.fn();
const removeToken = vi.fn();
const removeRefreshToken = vi.fn();
const setUser = vi.fn();
const setSubdomain = vi.fn();
const getSubdomain = vi.fn(() => "");
const markFreshLoginSession = vi.fn();

vi.mock("@features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/auth")>();
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      login: (...args: unknown[]) => login(...args),
      verifyMfaLogin: (...args: unknown[]) => verifyMfaLogin(...args),
    },
    tokenStorage: {
      hasSession: () => hasSession(),
      getUser: () => getUser(),
      getSubdomain: () => getSubdomain(),
      setToken: (...args: unknown[]) => setToken(...args),
      setRefreshToken: (...args: unknown[]) => setRefreshToken(...args),
      removeToken: () => removeToken(),
      removeRefreshToken: () => removeRefreshToken(),
      setUser: (...args: unknown[]) => setUser(...args),
      setSubdomain: (...args: unknown[]) => setSubdomain(...args),
    },
    markFreshLoginSession: () => markFreshLoginSession(),
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

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

function renderLogin(opts?: {
  fromPath?: string;
  initialPath?: string;
}) {
  const fromPath = opts?.fromPath;
  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: opts?.initialPath ?? "/login",
          state: fromPath
            ? { from: { pathname: fromPath } }
            : undefined,
        },
      ]}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>dashboard-page</div>} />
        <Route path="/settings" element={<div>settings-page</div>} />
        <Route path="/trips/:id" element={<div>trip-detail</div>} />
        <Route path="/onboarding" element={<div>onboarding-page</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

const baseUser = {
  id: "u1",
  email: "a@b.com",
  firstName: "A",
  lastName: "B",
  tenant: { id: "t1", name: "Acme", subdomain: "acme" },
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
} as const;

describe("LoginPage navigation (Ola 9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasSession.mockReturnValue(false);
    getUser.mockReturnValue(null);
    getSubdomain.mockReturnValue("");
  });

  it("N9-2: existing ERP session bounces to /dashboard", async () => {
    hasSession.mockReturnValue(true);
    getUser.mockReturnValue({
      ...baseUser,
      role: "manager",
    } as UserJSON);

    renderLogin();

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
    });
    expect(screen.getByText("dashboard-page")).toBeInTheDocument();
  });

  it("N9-2: bounce uses sanitized from for portal role", async () => {
    hasSession.mockReturnValue(true);
    getUser.mockReturnValue({
      ...baseUser,
      role: "client",
    } as UserJSON);

    renderLogin({ fromPath: "/settings" });

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
    });
  });

  it("N9-3: client login with from=/settings → /dashboard", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
      user: { ...baseUser, role: "client" },
    });

    renderLogin({ fromPath: "/settings" });

    await user.type(screen.getByLabelText(/Empresa/i), "acme");
    await user.type(screen.getByLabelText(/Correo electrónico/i), "a@b.com");
    await user.type(screen.getByLabelText(/^Contraseña$/i), "password1");
    await user.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
    });
  });

  it("N9-3: client login with from=/trips/:id keeps trips", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
      user: { ...baseUser, role: "client" },
    });

    renderLogin({ fromPath: "/trips/trip-1" });

    await user.type(screen.getByLabelText(/Empresa/i), "acme");
    await user.type(screen.getByLabelText(/Correo electrónico/i), "a@b.com");
    await user.type(screen.getByLabelText(/^Contraseña$/i), "password1");
    await user.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/trips/trip-1");
    });
  });

  it("N9-3: staff login keeps from=/settings", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
      user: { ...baseUser, role: "admin" },
    });

    renderLogin({ fromPath: "/settings" });

    await user.type(screen.getByLabelText(/Empresa/i), "acme");
    await user.type(screen.getByLabelText(/Correo electrónico/i), "a@b.com");
    await user.type(screen.getByLabelText(/^Contraseña$/i), "password1");
    await user.click(screen.getByRole("button", { name: /^Entrar$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent("/settings");
    });
  });
});
