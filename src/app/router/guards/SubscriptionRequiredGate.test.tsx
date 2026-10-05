import { describe, expect, it } from "vitest";
import {
  isAllowedWithoutOperationalSubscription,
  isOperationalSubscriptionStatus,
  shouldRedirectToSubscriptionPaywall,
} from "./SubscriptionRequiredGate";

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

  it("does not paywall portal roles client and driver", () => {
    for (const role of ["client", "driver"] as const) {
      expect(
        shouldRedirectToSubscriptionPaywall({
          role,
          pathname: "/dashboard",
          isLoading: false,
          isError: false,
          status: undefined,
        }),
      ).toBe(false);
    }
  });

  it("does not paywall staff when billing query errors (403 ≠ no plan)", () => {
    expect(
      shouldRedirectToSubscriptionPaywall({
        role: "manager",
        pathname: "/dashboard",
        isLoading: false,
        isError: true,
        status: undefined,
      }),
    ).toBe(false);
  });

  it("paywalls staff with non-operational status", () => {
    expect(
      shouldRedirectToSubscriptionPaywall({
        role: "admin",
        pathname: "/dashboard",
        isLoading: false,
        isError: false,
        status: "canceled",
      }),
    ).toBe(true);
    expect(
      shouldRedirectToSubscriptionPaywall({
        role: "accountant",
        pathname: "/trips",
        isLoading: false,
        isError: false,
        status: null,
      }),
    ).toBe(true);
  });

  it("allows staff with operational status", () => {
    expect(
      shouldRedirectToSubscriptionPaywall({
        role: "admin",
        pathname: "/dashboard",
        isLoading: false,
        isError: false,
        status: "active",
      }),
    ).toBe(false);
  });
});
