import { describe, expect, it } from "vitest";

/** Mirrors gate allowlist + operational statuses (unit without React Query). */
const OPERATIONAL_STATUSES = new Set(["trialing", "active", "past_due"]);

const ALLOWED_PATH_PREFIXES = [
  "/settings/subscription",
  "/account",
  "/profile",
  "/onboarding",
] as const;

function isAllowedWithoutOperationalSubscription(pathname: string): boolean {
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isOperationalSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  return status != null && OPERATIONAL_STATUSES.has(status);
}

describe("SubscriptionRequiredGate rules", () => {
  it("allows billing and account paths without operational sub", () => {
    expect(isAllowedWithoutOperationalSubscription("/settings/subscription")).toBe(
      true,
    );
    expect(isAllowedWithoutOperationalSubscription("/account")).toBe(true);
    expect(isAllowedWithoutOperationalSubscription("/account/security")).toBe(
      true,
    );
    expect(isAllowedWithoutOperationalSubscription("/profile")).toBe(true);
    expect(isAllowedWithoutOperationalSubscription("/dashboard")).toBe(false);
  });

  it("treats past_due as operational (grace)", () => {
    expect(isOperationalSubscriptionStatus("past_due")).toBe(true);
    expect(isOperationalSubscriptionStatus("active")).toBe(true);
    expect(isOperationalSubscriptionStatus("canceled")).toBe(false);
    expect(isOperationalSubscriptionStatus(undefined)).toBe(false);
  });
});
