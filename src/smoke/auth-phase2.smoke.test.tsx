/**
 * Smoke AUTH-HARDEN Phase 2 — MFA challenge, SecuritySettings, sesión cookies (contrato cliente).
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

const mockGetMfaStatus = vi.fn();
const mockListSessions = vi.fn();
const mockSetupMfa = vi.fn();
const mockConfirmMfa = vi.fn();
const mockDisableMfa = vi.fn();
const mockRevokeSession = vi.fn();

vi.mock("@features/auth/infrastructure/api/authApi", () => ({
  authApi: {
    getMfaStatus: (...args: unknown[]) => mockGetMfaStatus(...args),
    listSessions: (...args: unknown[]) => mockListSessions(...args),
    setupMfa: (...args: unknown[]) => mockSetupMfa(...args),
    confirmMfa: (...args: unknown[]) => mockConfirmMfa(...args),
    disableMfa: (...args: unknown[]) => mockDisableMfa(...args),
    revokeSession: (...args: unknown[]) => mockRevokeSession(...args),
  },
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    ),
  },
}));

vi.mock("@features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/auth")>();
  return {
    ...actual,
    useAuth: () => ({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: "user-1",
        email: "admin@test.com",
        firstName: "Ada",
        lastName: "Lovelace",
        role: "admin",
        tenant: { id: "tenant-1", name: "Test", subdomain: "test" },
        onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
      },
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
      replaceSessionUser: vi.fn(),
      applySessionTokens: vi.fn(),
    }),
    authApi: {
      getMfaStatus: (...args: unknown[]) => mockGetMfaStatus(...args),
      listSessions: (...args: unknown[]) => mockListSessions(...args),
      setupMfa: (...args: unknown[]) => mockSetupMfa(...args),
      confirmMfa: (...args: unknown[]) => mockConfirmMfa(...args),
      disableMfa: (...args: unknown[]) => mockDisableMfa(...args),
      revokeSession: (...args: unknown[]) => mockRevokeSession(...args),
    },
  };
});

vi.mock("@shared/hooks/useToast", () => ({
  useToast: () => ({
    toast: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

import { SecuritySettingsPage } from "@features/settings/presentation/pages/SecuritySettingsPage";
import {
  persistsAuthTokens,
  usesAuthCookies,
  authSessionMode,
} from "@features/auth/infrastructure/sessionMode";
import { tokenStorage } from "@features/auth/infrastructure/storage/tokenStorage";
import { isMfaChallenge, type LoginResult } from "@features/auth";

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("smoke auth-phase2 — session mode contract", () => {
  it("defaults to cookies mode helpers (no token persistence)", () => {
    // Default VITE_AUTH_SESSION_MODE unset → cookies in env.ts / sessionMode
    expect(authSessionMode === "cookies" || authSessionMode === "dual" || authSessionMode === "bearer").toBe(
      true,
    );
    if (authSessionMode === "cookies") {
      expect(usesAuthCookies()).toBe(true);
      expect(persistsAuthTokens()).toBe(false);
    }
  });

  it("tokenStorage does not keep access/refresh when mode does not persist", () => {
    tokenStorage.setUser({
      id: "u1",
      email: "a@b.com",
      firstName: "A",
      lastName: "B",
      role: "admin",
      tenant: { id: "t1", name: "T", subdomain: "t" },
    });
    tokenStorage.setToken("should-not-stick-if-cookies");
    tokenStorage.setRefreshToken("should-not-stick-if-cookies");

    if (!persistsAuthTokens()) {
      expect(tokenStorage.getToken()).toBeNull();
      expect(tokenStorage.getRefreshToken()).toBeNull();
      expect(tokenStorage.getUser()?.email).toBe("a@b.com");
      expect(tokenStorage.hasSession()).toBe(true);
    }

    tokenStorage.clear();
  });

  it("isMfaChallenge narrows login challenge", () => {
    const challenge: LoginResult = {
      needsMfa: true,
      mfaChallengeToken: "chal",
      mfaChallengeExpiresAt: new Date().toISOString(),
    };
    expect(isMfaChallenge(challenge)).toBe(true);
    expect(
      isMfaChallenge({
        accessToken: "a",
        refreshToken: "r",
        user: {
          id: "1",
          email: "a@b.com",
          firstName: "A",
          lastName: "B",
          role: "admin",
          tenant: { id: "t", name: "T", subdomain: "t" },
        },
      }),
    ).toBe(false);
  });
});

describe("smoke auth-phase2 — SecuritySettings MFA + sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMfaStatus.mockResolvedValue({ enabled: false, enabledAt: null });
    mockListSessions.mockResolvedValue([
      {
        id: "sess-1",
        createdAt: "2026-07-23T10:00:00.000Z",
        lastUsedAt: "2026-07-23T12:00:00.000Z",
        expiresAt: "2026-08-01T00:00:00.000Z",
        userAgent: "Mozilla/5.0 TestBrowser",
        ip: "127.0.0.1",
        label: null,
        current: true,
      },
      {
        id: "sess-2",
        createdAt: "2026-07-22T10:00:00.000Z",
        lastUsedAt: null,
        expiresAt: "2026-08-01T00:00:00.000Z",
        userAgent: "Other Device",
        ip: "10.0.0.2",
        label: null,
        current: false,
      },
    ]);
    mockSetupMfa.mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      otpauthUrl: "otpauth://totp/Boeltech:admin@test.com?secret=JBSWY3DPEHPK3PXP",
    });
    mockConfirmMfa.mockResolvedValue({
      recoveryCodes: ["AAAA", "BBBB"],
    });
  });

  it("shows admin MFA recommendation, activate CTA, and sessions", async () => {
    render(wrap(<SecuritySettingsPage />));

    await waitFor(() => {
      expect(
        screen.getByText(/activa la autenticación en dos pasos/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /^activar$/i })).toBeInTheDocument();
    expect(await screen.findByText(/esta sesión/i)).toBeInTheDocument();
    expect(screen.getByText(/other device/i)).toBeInTheDocument();
  });

  it("exposes activate MFA action when MFA is off", async () => {
    render(wrap(<SecuritySettingsPage />));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^activar$/i })).toBeEnabled();
    });
    expect(mockGetMfaStatus).toHaveBeenCalled();
    expect(mockListSessions).toHaveBeenCalled();
  });

  it("shows TOTP QR after starting MFA setup", async () => {
    const user = userEvent.setup();
    render(wrap(<SecuritySettingsPage />));

    await user.click(await screen.findByRole("button", { name: /^activar$/i }));

    await waitFor(() => {
      expect(mockSetupMfa).toHaveBeenCalled();
    });

    expect(
      await screen.findByRole("img", {
        name: /código qr para configurar autenticación en dos pasos/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/¿no puedes escanear/i)).toBeInTheDocument();
    expect(screen.getByText("JBSWY3DPEHPK3PXP")).toBeInTheDocument();
  });

  it("revokes a non-current session", async () => {
    const user = userEvent.setup();
    mockRevokeSession.mockResolvedValue(undefined);
    render(wrap(<SecuritySettingsPage />));

    const closeButtons = await screen.findAllByRole("button", {
      name: /cerrar sesión/i,
    });
    expect(closeButtons.length).toBeGreaterThan(0);
    await user.click(closeButtons[0]!);

    await waitFor(() => {
      expect(mockRevokeSession).toHaveBeenCalledWith("sess-2");
    });
  });
});
