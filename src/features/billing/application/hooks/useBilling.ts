import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@features/auth";
import { isSubscriptionPaywallExemptRole } from "@shared/constants/roles";
import { billingQueryKeys } from "../../domain/entities";
import { billingApi } from "../../infrastructure/billingApi";

function useBillingQueryEnabled(): boolean {
  const { isAuthenticated, user } = useAuth();
  return Boolean(
    isAuthenticated && user && !isSubscriptionPaywallExemptRole(user.role),
  );
}

type BillingQueryOptions = {
  /** Extra gate (e.g. billing.read for commercial payloads). */
  enabled?: boolean;
};

/** Soft-gate + module paywall — available without billing.read. */
export const useBillingAccess = (options?: BillingQueryOptions) => {
  const enabled = useBillingQueryEnabled() && (options?.enabled ?? true);
  return useQuery({
    queryKey: billingQueryKeys.access(),
    queryFn: () => billingApi.getAccess(),
    staleTime: 60_000,
    enabled,
  });
};

export const useBillingSubscription = (options?: BillingQueryOptions) => {
  const enabled = useBillingQueryEnabled() && (options?.enabled ?? true);
  return useQuery({
    queryKey: billingQueryKeys.subscription(),
    queryFn: () => billingApi.getSubscription(),
    staleTime: 60_000,
    enabled,
  });
};

export const useBillingUsage = (options?: BillingQueryOptions) => {
  const enabled = useBillingQueryEnabled() && (options?.enabled ?? true);
  return useQuery({
    queryKey: billingQueryKeys.usage(),
    queryFn: () => billingApi.getUsage(),
    staleTime: 60_000,
    enabled,
  });
};

export const useBillingEntitlements = (options?: BillingQueryOptions) => {
  const enabled = useBillingQueryEnabled() && (options?.enabled ?? true);
  return useQuery({
    queryKey: billingQueryKeys.entitlements(),
    queryFn: () => billingApi.getEntitlements(),
    staleTime: 60_000,
    enabled,
  });
};

export const useBillingArrears = (options?: BillingQueryOptions) => {
  const enabled = useBillingQueryEnabled() && (options?.enabled ?? true);
  return useQuery({
    queryKey: billingQueryKeys.arrears(),
    queryFn: () => billingApi.getArrears(),
    staleTime: 60_000,
    enabled,
  });
};

/**
 * Module entitlement for paywall UI. Uses slim /billing/access so roles
 * without billing.read do not treat 403 as “not entitled”.
 */
export const useHasBillingModule = (moduleCode: string) => {
  const query = useBillingAccess();
  const hasModule =
    query.isSuccess &&
    (query.data?.effectiveModuleCodes.includes(moduleCode) ?? false);
  return { ...query, hasModule };
};
