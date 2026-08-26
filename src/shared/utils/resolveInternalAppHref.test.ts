import { describe, expect, it } from "vitest";
import { resolveInternalAppHref } from "./resolveInternalAppHref";

describe("resolveInternalAppHref", () => {
  const fallback = "/trips";

  it("returns fallback when from is undefined or empty", () => {
    expect(resolveInternalAppHref(undefined, fallback)).toBe(fallback);
    expect(resolveInternalAppHref("", fallback)).toBe(fallback);
    expect(resolveInternalAppHref("   ", fallback)).toBe(fallback);
  });

  it("accepts relative internal paths", () => {
    expect(resolveInternalAppHref("/trips", fallback)).toBe("/trips");
    expect(resolveInternalAppHref("/approvals?tab=open", fallback)).toBe(
      "/approvals?tab=open",
    );
    expect(resolveInternalAppHref("/finance/invoices", fallback)).toBe(
      "/finance/invoices",
    );
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(resolveInternalAppHref("https://evil.example/phish", fallback)).toBe(
      fallback,
    );
    expect(resolveInternalAppHref("//evil.example/path", fallback)).toBe(
      fallback,
    );
    expect(resolveInternalAppHref("javascript:alert(1)", fallback)).toBe(
      fallback,
    );
  });
});
