import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeFreshLoginSession,
  markFreshLoginSession,
  tokenStorage,
} from "./tokenStorage";

describe("fresh login session flag", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("marks and consumes fresh login once", () => {
    expect(consumeFreshLoginSession()).toBe(false);

    markFreshLoginSession();
    expect(consumeFreshLoginSession()).toBe(true);
    expect(consumeFreshLoginSession()).toBe(false);
  });
});

describe("tokenStorage.clear", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes subdomain along with tokens and user", () => {
    localStorage.setItem("erp_access_token", "a");
    localStorage.setItem("erp_refresh_token", "r");
    localStorage.setItem("erp_user", "{}");
    localStorage.setItem("erp_subdomain", "acme");

    tokenStorage.clear();

    expect(localStorage.getItem("erp_access_token")).toBeNull();
    expect(localStorage.getItem("erp_refresh_token")).toBeNull();
    expect(localStorage.getItem("erp_user")).toBeNull();
    expect(localStorage.getItem("erp_subdomain")).toBeNull();
  });
});

describe("tokenStorage.hasSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns false when empty; cookies mode uses erp_user as marker", () => {
    expect(tokenStorage.hasSession()).toBe(false);
    localStorage.setItem("erp_user", JSON.stringify({ id: "u1" }));
    // Default sessionMode in Vitest is cookies (unless PROD dual) → erp_user marks session
    expect(tokenStorage.hasSession()).toBe(true);
  });
});
