import { describe, expect, it } from "vitest";
import {
  AdminActivationStatus,
  PlatformTenantStatus,
} from "../../domain/entities";
import { resolveHubPrimaryKind } from "./hubPrimaryCta";

const base = {
  canMutate: true,
  accessStatus: PlatformTenantStatus.ACTIVE,
  subscriptionStatus: "active" as string | null,
  activationStatus: AdminActivationStatus.ACTIVATED,
  hasOpenInvoices: false,
};

describe("resolveHubPrimaryKind", () => {
  it("returns null when the session cannot mutate or the company is canceled", () => {
    expect(
      resolveHubPrimaryKind({
        ...base,
        canMutate: false,
      }),
    ).toBeNull();

    expect(
      resolveHubPrimaryKind({
        ...base,
        accessStatus: PlatformTenantStatus.CANCELLED,
        subscriptionStatus: "canceled",
        hasOpenInvoices: true,
      }),
    ).toBeNull();
  });

  it("registers payment before reactivate when collection is pending", () => {
    expect(
      resolveHubPrimaryKind({
        ...base,
        accessStatus: PlatformTenantStatus.SUSPENDED,
        subscriptionStatus: "past_due",
        activationStatus: AdminActivationStatus.PENDING,
        hasOpenInvoices: true,
      }),
    ).toBe("register_payment");

    expect(
      resolveHubPrimaryKind({
        ...base,
        subscriptionStatus: "past_due",
      }),
    ).toBe("register_payment");

    expect(
      resolveHubPrimaryKind({
        ...base,
        hasOpenInvoices: true,
        activationStatus: AdminActivationStatus.PENDING,
      }),
    ).toBe("register_payment");
  });

  it("reactivates, resends, or continues onboarding only after collection is clear", () => {
    expect(
      resolveHubPrimaryKind({
        ...base,
        accessStatus: PlatformTenantStatus.SUSPENDED,
      }),
    ).toBe("reactivate");

    expect(
      resolveHubPrimaryKind({
        ...base,
        activationStatus: AdminActivationStatus.PENDING,
      }),
    ).toBe("resend_activation");

    expect(
      resolveHubPrimaryKind({
        ...base,
        lifecycleStage: "prospect",
      }),
    ).toBe("continue_onboarding");
  });

  it("returns no solid when the company is current", () => {
    expect(resolveHubPrimaryKind(base)).toBeNull();
  });
});
