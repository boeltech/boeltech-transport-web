import { describe, expect, it } from "vitest";
import { shouldRedirectOnSubscriptionRequired } from "./shouldRedirectOnSubscriptionRequired";

describe("shouldRedirectOnSubscriptionRequired", () => {
  it("does not redirect on /platform paths", () => {
    expect(shouldRedirectOnSubscriptionRequired("/platform")).toBe(false);
    expect(shouldRedirectOnSubscriptionRequired("/platform/tenants")).toBe(
      false,
    );
    expect(shouldRedirectOnSubscriptionRequired("/platform/security")).toBe(
      false,
    );
  });

  it("does not redirect on allowlisted tenant paths", () => {
    expect(shouldRedirectOnSubscriptionRequired("/settings/subscription")).toBe(
      false,
    );
    expect(
      shouldRedirectOnSubscriptionRequired("/settings/subscription/usage"),
    ).toBe(false);
    expect(shouldRedirectOnSubscriptionRequired("/login")).toBe(false);
  });

  it("redirects on normal tenant app paths", () => {
    expect(shouldRedirectOnSubscriptionRequired("/trips")).toBe(true);
    expect(shouldRedirectOnSubscriptionRequired("/dashboard")).toBe(true);
  });
});
