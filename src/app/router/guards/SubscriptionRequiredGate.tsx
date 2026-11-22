/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@features/auth";
import { useBillingAccess } from "@features/billing";
import {
  isSubscriptionPaywallExemptRole,
  type UserRole,
} from "@shared/constants/roles";
import { resolveModuleNavLabel } from "@shared/utils/masterWayfinding";

const OPERATIONAL_STATUSES = new Set(["trialing", "active", "past_due"]);

const ALLOWED_PATH_PREFIXES = [
  "/settings/subscription",
  "/account",
  "/profile",
  "/onboarding",
] as const;

export function isAllowedWithoutOperationalSubscription(pathname: string): boolean {
  return ALLOWED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isOperationalSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  return status != null && OPERATIONAL_STATUSES.has(status);
}

/** State de wayfinding al redirigir al paywall de Tu plan (H-U09-N02). */
export function buildSubscriptionRequiredNavState(location: {
  pathname: string;
  search: string;
}): {
  from: string;
  fromLabel?: string;
  subscriptionRequired: true;
} {
  const from = `${location.pathname}${location.search}`;
  const fromLabel = resolveModuleNavLabel(from);
  return {
    from,
    ...(fromLabel ? { fromLabel } : {}),
    subscriptionRequired: true,
  };
}

/**
 * Soft paywall decision for staff tenants (ADR-0064 alcance 2).
 * Portal roles and billing access errors must not be treated as “no plan”.
 */
export function shouldRedirectToSubscriptionPaywall(input: {
  role: UserRole | null | undefined;
  pathname: string;
  isLoading: boolean;
  isError: boolean;
  status: string | null | undefined;
}): boolean {
  if (isSubscriptionPaywallExemptRole(input.role)) {
    return false;
  }
  if (isAllowedWithoutOperationalSubscription(input.pathname)) {
    return false;
  }
  if (input.isLoading || input.isError) {
    return false;
  }
  return !isOperationalSubscriptionStatus(input.status);
}

/**
 * Tras onboarding: si la suscripción no es trialing|active|past_due,
 * redirige a `/settings/subscription` (paywall operativo ADR-0064 alcance 2).
 * Usa GET /billing/access (sin billing.read).
 * Roles `client`/`driver` quedan fuera del soft-gate.
 */
export function SubscriptionRequiredGate({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const access = useBillingAccess();

  if (!isAuthenticated || !user) {
    return <>{children}</>;
  }

  if (
    !shouldRedirectToSubscriptionPaywall({
      role: user.role,
      pathname: location.pathname,
      isLoading: access.isLoading,
      isError: access.isError,
      status: access.data?.subscriptionStatus,
    })
  ) {
    if (
      !isSubscriptionPaywallExemptRole(user.role) &&
      !isAllowedWithoutOperationalSubscription(location.pathname) &&
      access.isLoading
    ) {
      return null;
    }
    return <>{children}</>;
  }

  return (
    <Navigate
      to="/settings/subscription"
      replace
      state={buildSubscriptionRequiredNavState(location)}
    />
  );
}
