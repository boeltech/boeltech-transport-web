/**
 * Platform vs ERP session boundaries: clearing one identity must not wipe the other.
 * Covers the storage side of H1–H4 remediation (multi-tab ERP onStorage only watches erp_*).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { platformTokenStorage } from "./platformTokenStorage";
import { tokenStorage } from "@features/auth/infrastructure/storage/tokenStorage";

const TENANT_USER = JSON.stringify({
  id: "tenant-user-1",
  email: "ops@acme.test",
});
const PLATFORM_USER = JSON.stringify({
  id: "platform-user-1",
  email: "owner@boeltech.test",
  platformRole: "platform_owner",
});

function seedBothSessions(): void {
  localStorage.setItem("erp_access_token", "tenant-at");
  localStorage.setItem("erp_refresh_token", "tenant-rt");
  localStorage.setItem("erp_user", TENANT_USER);
  localStorage.setItem("erp_subdomain", "acme");
  localStorage.setItem("erp_platform_access_token", "platform-at");
  localStorage.setItem("erp_platform_refresh_token", "platform-rt");
  localStorage.setItem("erp_platform_user", PLATFORM_USER);
}

describe("Platform vs ERP session storage isolation", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("platformTokenStorage.clear leaves tenant erp_* keys intact", () => {
    seedBothSessions();

    platformTokenStorage.clear();

    expect(localStorage.getItem("erp_platform_access_token")).toBeNull();
    expect(localStorage.getItem("erp_platform_refresh_token")).toBeNull();
    expect(localStorage.getItem("erp_platform_user")).toBeNull();
    expect(localStorage.getItem("erp_access_token")).toBe("tenant-at");
    expect(localStorage.getItem("erp_refresh_token")).toBe("tenant-rt");
    expect(localStorage.getItem("erp_user")).toBe(TENANT_USER);
    expect(localStorage.getItem("erp_subdomain")).toBe("acme");
    expect(tokenStorage.hasSession()).toBe(true);
  });

  it("tokenStorage.clear leaves erp_platform_* keys intact", () => {
    seedBothSessions();

    tokenStorage.clear();

    expect(localStorage.getItem("erp_access_token")).toBeNull();
    expect(localStorage.getItem("erp_refresh_token")).toBeNull();
    expect(localStorage.getItem("erp_user")).toBeNull();
    expect(localStorage.getItem("erp_platform_access_token")).toBe("platform-at");
    expect(localStorage.getItem("erp_platform_refresh_token")).toBe(
      "platform-rt",
    );
    expect(localStorage.getItem("erp_platform_user")).toBe(PLATFORM_USER);
    expect(platformTokenStorage.hasSession()).toBe(true);
  });
});
