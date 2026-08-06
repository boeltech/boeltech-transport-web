import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@features/auth";
import { isSubscriptionPaywallExemptRole } from "@shared/constants/roles";
import { billingQueryKeys, INTERNAL_STAFF_MODULE_CODE } from "../../domain/entities";
import { billingApi } from "../../infrastructure/billingApi";

function useBillingQueryEnabled(): boolean {
  const { isAuthenticated, user } = useAuth();
  return Boolean(
    isAuthenticated && user && !isSubscriptionPaywallExemptRole(user.role),
  );
}

export const useBillingSubscription = () => {
  const enabled = useBillingQueryEnabled();
  return useQuery({
    queryKey: billingQueryKeys.subscription(),
    queryFn: () => billingApi.getSubscription(),
    staleTime: 60_000,
    enabled,
  });
};

export const useBillingUsage = () => {
  const enabled = useBillingQueryEnabled();
  return useQuery({
    queryKey: billingQueryKeys.usage(),
    queryFn: () => billingApi.getUsage(),
    staleTime: 60_000,
    enabled,
  });
};

export const useBillingEntitlements = () => {
  const enabled = useBillingQueryEnabled();
  return useQuery({
    queryKey: billingQueryKeys.entitlements(),
    queryFn: () => billingApi.getEntitlements(),
    staleTime: 60_000,
    enabled,
  });
};

export const useBillingArrears = () => {
  const enabled = useBillingQueryEnabled();
  return useQuery({
    queryKey: billingQueryKeys.arrears(),
    queryFn: () => billingApi.getArrears(),
    staleTime: 60_000,
    enabled,
  });
};

export const useHasBillingModule = (moduleCode: string) => {
  const query = useBillingEntitlements();
  const hasModule =
    query.data?.effectiveModuleCodes.includes(moduleCode) ?? false;
  return { ...query, hasModule };
};

export const useInternalStaffEntitlement = () =>
  useHasBillingModule(INTERNAL_STAFF_MODULE_CODE);
