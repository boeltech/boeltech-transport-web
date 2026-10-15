import { describe, expect, it } from "vitest";
import {
  isClientPostLoginPathAllowed,
  isDriverPostLoginPathAllowed,
  POST_LOGIN_FALLBACK,
  resolvePostLoginHref,
} from "./resolvePostLoginHref";

describe("isClientPostLoginPathAllowed", () => {
  it("allows client portal surfaces", () => {
    expect(isClientPostLoginPathAllowed("/dashboard")).toBe(true);
    expect(isClientPostLoginPathAllowed("/trips")).toBe(true);
    expect(isClientPostLoginPathAllowed("/trips/abc")).toBe(true);
    expect(isClientPostLoginPathAllowed("/finance/invoices")).toBe(true);
    expect(isClientPostLoginPathAllowed("/invoices/inv-1")).toBe(true);
    expect(isClientPostLoginPathAllowed("/account")).toBe(true);
    expect(isClientPostLoginPathAllowed("/account/security")).toBe(true);
    expect(isClientPostLoginPathAllowed("/notifications")).toBe(true);
    expect(isClientPostLoginPathAllowed("/onboarding")).toBe(true);
    expect(isClientPostLoginPathAllowed("/ayuda")).toBe(true);
    expect(isClientPostLoginPathAllowed("/ayuda/tickets")).toBe(true);
  });

  it("denies staff / out-of-portal paths", () => {
    expect(isClientPostLoginPathAllowed("/settings")).toBe(false);
    expect(isClientPostLoginPathAllowed("/settings/subscription")).toBe(false);
    expect(isClientPostLoginPathAllowed("/vehicles")).toBe(false);
    expect(isClientPostLoginPathAllowed("/invoices/new")).toBe(false);
    expect(isClientPostLoginPathAllowed("/invoices/inv-1/edit")).toBe(false);
    expect(isClientPostLoginPathAllowed("/finance")).toBe(false);
    expect(isClientPostLoginPathAllowed("/reports")).toBe(false);
  });
});

describe("isDriverPostLoginPathAllowed", () => {
  it("allows driver portal surfaces", () => {
    expect(isDriverPostLoginPathAllowed("/dashboard")).toBe(true);
    expect(isDriverPostLoginPathAllowed("/trips/t1")).toBe(true);
    expect(isDriverPostLoginPathAllowed("/account")).toBe(true);
    expect(isDriverPostLoginPathAllowed("/notifications")).toBe(true);
    expect(isDriverPostLoginPathAllowed("/onboarding")).toBe(true);
    expect(isDriverPostLoginPathAllowed("/ayuda/x")).toBe(true);
  });

  it("denies invoices and staff paths", () => {
    expect(isDriverPostLoginPathAllowed("/finance/invoices")).toBe(false);
    expect(isDriverPostLoginPathAllowed("/invoices/inv-1")).toBe(false);
    expect(isDriverPostLoginPathAllowed("/vehicles")).toBe(false);
    expect(isDriverPostLoginPathAllowed("/settings")).toBe(false);
  });
});

describe("resolvePostLoginHref", () => {
  it("client: from=/settings → dashboard", () => {
    expect(resolvePostLoginHref("/settings", "client")).toBe(
      POST_LOGIN_FALLBACK,
    );
  });

  it("client: keeps allowed from with query", () => {
    expect(resolvePostLoginHref("/finance/invoices?tab=open", "client")).toBe(
      "/finance/invoices?tab=open",
    );
  });

  it("driver: from=/vehicles → dashboard", () => {
    expect(resolvePostLoginHref("/vehicles", "driver")).toBe(
      POST_LOGIN_FALLBACK,
    );
  });

  it("driver: keeps /trips", () => {
    expect(resolvePostLoginHref("/trips/abc", "driver")).toBe("/trips/abc");
  });

  it("staff: keeps from via resolveInternalAppHref", () => {
    expect(resolvePostLoginHref("/settings/approvals", "admin")).toBe(
      "/settings/approvals",
    );
    expect(resolvePostLoginHref("/vehicles", "manager")).toBe("/vehicles");
  });

  it("staff: rejects external URLs", () => {
    expect(resolvePostLoginHref("https://evil.example", "admin")).toBe(
      POST_LOGIN_FALLBACK,
    );
  });

  it("empty from → dashboard for all roles", () => {
    expect(resolvePostLoginHref(undefined, "client")).toBe(POST_LOGIN_FALLBACK);
    expect(resolvePostLoginHref("", "driver")).toBe(POST_LOGIN_FALLBACK);
    expect(resolvePostLoginHref(undefined, "dispatcher")).toBe(
      POST_LOGIN_FALLBACK,
    );
  });
});
