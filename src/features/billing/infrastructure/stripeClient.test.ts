import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import {
  isSaasStripeNotConfiguredError,
  isStripePublishableConfigured,
  SAAS_STRIPE_NOT_CONFIGURED,
} from "./stripeClient";

describe("stripeClient", () => {
  it("exposes publishable configured as boolean from env", () => {
    expect(typeof isStripePublishableConfigured()).toBe("boolean");
  });

  it("detects SAAS_STRIPE_NOT_CONFIGURED ApiError", () => {
    const err = new ApiError("Gateway down", 503, SAAS_STRIPE_NOT_CONFIGURED);
    expect(isSaasStripeNotConfiguredError(err)).toBe(true);
    expect(isSaasStripeNotConfiguredError(new Error("x"))).toBe(false);
  });
});
