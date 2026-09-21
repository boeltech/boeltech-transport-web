/**
 * Lazy Stripe.js loader for SaaS AR Elements (ADR-0076).
 * Publishable key only — never secret. Empty key = CTAs hidden.
 */
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { isApiError } from "@shared/api/interceptors/error-handler";
import config from "@shared/config/env";

export const SAAS_STRIPE_NOT_CONFIGURED = "SAAS_STRIPE_NOT_CONFIGURED";

let stripePromise: Promise<Stripe | null> | null = null;

export function isStripePublishableConfigured(): boolean {
  return config.stripe.publishableKey.length > 0;
}

/** Singleton promise; null when publishable key is absent. */
export function getStripePromise(): Promise<Stripe | null> {
  if (!isStripePublishableConfigured()) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(config.stripe.publishableKey);
  }
  return stripePromise;
}

/** Reset between tests. */
export function resetStripePromiseForTests(): void {
  stripePromise = null;
}

export function isSaasStripeNotConfiguredError(error: unknown): boolean {
  return isApiError(error) && error.code === SAAS_STRIPE_NOT_CONFIGURED;
}
