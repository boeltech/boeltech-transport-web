import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const clear = vi.fn();
const usesAuthCookies = vi.fn();

vi.mock("@shared/api", () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}));

vi.mock("@features/auth/infrastructure/storage/tokenStorage", () => ({
  tokenStorage: { clear: () => clear() },
}));

vi.mock("@features/auth/infrastructure/sessionMode", () => ({
  usesAuthCookies: () => usesAuthCookies(),
}));

describe("clearTenantSessionForPlatformBoundary", () => {
  beforeEach(() => {
    post.mockReset();
    clear.mockReset();
    usesAuthCookies.mockReset();
  });

  it("clears tokenStorage and posts /auth/logout when cookies mode", async () => {
    usesAuthCookies.mockReturnValue(true);
    post.mockResolvedValue({});
    const { clearTenantSessionForPlatformBoundary } = await import(
      "./clearTenantSessionBoundary"
    );
    await clearTenantSessionForPlatformBoundary();
    expect(post).toHaveBeenCalledWith("/auth/logout");
    expect(clear).toHaveBeenCalled();
  });

  it("clears tokenStorage without logout POST in bearer-only mode", async () => {
    usesAuthCookies.mockReturnValue(false);
    const { clearTenantSessionForPlatformBoundary } = await import(
      "./clearTenantSessionBoundary"
    );
    await clearTenantSessionForPlatformBoundary();
    expect(post).not.toHaveBeenCalled();
    expect(clear).toHaveBeenCalled();
  });

  it("still clears storage if logout POST fails", async () => {
    usesAuthCookies.mockReturnValue(true);
    post.mockRejectedValue(new Error("network"));
    const { clearTenantSessionForPlatformBoundary } = await import(
      "./clearTenantSessionBoundary"
    );
    await clearTenantSessionForPlatformBoundary();
    expect(clear).toHaveBeenCalled();
  });
});
