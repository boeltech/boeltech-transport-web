import { describe, expect, it } from "vitest";
import {
  billingSettingsHydrationKey,
  shouldHydrateBillingSettings,
} from "./billingSettingsHydration";

describe("shouldHydrateBillingSettings", () => {
  it("hydrates when nothing has been hydrated yet", () => {
    expect(shouldHydrateBillingSettings(null, "billing-1")).toBe(true);
  });

  it("re-hydrates when settings id changes", () => {
    expect(
      shouldHydrateBillingSettings(
        billingSettingsHydrationKey("billing-1"),
        "billing-2",
      ),
    ).toBe(true);
  });

  it("does not re-hydrate same id (cache updates from CSD upload must not reset form)", () => {
    expect(
      shouldHydrateBillingSettings(
        billingSettingsHydrationKey("billing-1"),
        "billing-1",
      ),
    ).toBe(false);
  });
});
