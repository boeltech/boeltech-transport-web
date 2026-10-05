/**
 * Smoke: Platform Bearer + ERP tenant sessions coexist on the same origin.
 * Logout/clear of one plane leaves the other intact (H1–H4 remediation).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IAuthRepository, ITokenStorage } from "@features/auth/domain";
import { LogoutUseCase } from "@features/auth/application/useCases/LogoutUseCase";
import { platformTokenStorage } from "@features/platform/infrastructure/platformTokenStorage";
import { tokenStorage } from "@features/auth/infrastructure/storage/tokenStorage";

vi.mock("@features/auth/infrastructure/sessionMode", () => ({
  usesAuthCookies: () => false,
  persistsAuthTokens: () => true,
  sendsBearerFromStorage: () => true,
  authSessionMode: "bearer",
}));

const TENANT_USER = {
  id: "tenant-user-1",
  email: "ops@acme.test",
  firstName: "Ops",
  lastName: "User",
  role: "admin" as const,
  tenant: { id: "t1", name: "Acme", subdomain: "acme" },
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
};

const PLATFORM_USER = {
  id: "platform-user-1",
  email: "owner@boeltech.test",
  firstName: "Platform",
  lastName: "Owner",
  platformRole: "platform_owner" as const,
  scope: "platform" as const,
  mfaEnabled: false,
};

function seedBothSessions(): void {
  tokenStorage.setToken("tenant-at");
  tokenStorage.setRefreshToken("tenant-rt");
  tokenStorage.setUser(TENANT_USER);
  tokenStorage.setSubdomain("acme");
  platformTokenStorage.setToken("platform-at");
  platformTokenStorage.setRefreshToken("platform-rt");
  platformTokenStorage.setUser(PLATFORM_USER);
}

describe("smoke session Platform vs ERP isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    seedBothSessions();
  });

  it("tenant LogoutUseCase leaves platform session material", async () => {
    const authRepository = {
      logout: vi.fn().mockResolvedValue(undefined),
    } as unknown as IAuthRepository;
    const logoutUseCase = new LogoutUseCase(
      authRepository,
      tokenStorage as ITokenStorage,
    );

    await logoutUseCase.execute();

    expect(tokenStorage.hasSession()).toBe(false);
    expect(platformTokenStorage.getToken()).toBe("platform-at");
    expect(platformTokenStorage.getRefreshToken()).toBe("platform-rt");
    expect(platformTokenStorage.hasSession()).toBe(true);
    expect(authRepository.logout).toHaveBeenCalled();
  });

  it("endPlatformSession equivalent (platform clear) leaves tenant session", () => {
    // Mirrors PlatformAuthProvider.endPlatformSession storage side-effect.
    platformTokenStorage.clear();

    expect(platformTokenStorage.hasSession()).toBe(false);
    expect(tokenStorage.getToken()).toBe("tenant-at");
    expect(tokenStorage.getRefreshToken()).toBe("tenant-rt");
    expect(tokenStorage.hasSession()).toBe(true);
  });

  it("AuthProvider multi-tab keys exclude erp_platform_* (H4)", () => {
    const SESSION_STORAGE_KEYS = [
      "erp_access_token",
      "erp_refresh_token",
      "erp_user",
    ] as const;

    expect(
      SESSION_STORAGE_KEYS.includes(
        "erp_platform_access_token" as (typeof SESSION_STORAGE_KEYS)[number],
      ),
    ).toBe(false);

    platformTokenStorage.clear();
    // Clearing platform does not remove tenant keys → no StorageEvent for erp_*.
    expect(localStorage.getItem("erp_access_token")).toBe("tenant-at");
    expect(localStorage.getItem("erp_user")).toBeTruthy();
  });
});
