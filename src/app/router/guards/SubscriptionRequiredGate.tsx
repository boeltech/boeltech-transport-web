import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@features/auth";
import { useBillingSubscription } from "@features/billing";

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

/**
 * Tras onboarding: si la suscripción no es trialing|active|past_due,
 * redirige a `/settings/subscription` (paywall operativo ADR-0064 alcance 2).
 * Login y billing GET siguen permitidos en API.
 */
export function SubscriptionRequiredGate({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const subscription = useBillingSubscription();

  if (!isAuthenticated || !user) {
    return <>{children}</>;
  }

  if (isAllowedWithoutOperationalSubscription(location.pathname)) {
    return <>{children}</>;
  }

  if (subscription.isLoading) {
    return null;
  }

  const status = subscription.data?.status;
  const isOperational =
    status != null && OPERATIONAL_STATUSES.has(status);

  if (isOperational) {
    return <>{children}</>;
  }

  return (
    <Navigate
      to="/settings/subscription"
      replace
      state={{ from: location, subscriptionRequired: true }}
    />
  );
}
