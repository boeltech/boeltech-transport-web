import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@features/auth";
import { billingQueryKeys, INTERNAL_STAFF_MODULE_CODE } from "../../domain/entities";
import { billingApi } from "../../infrastructure/billingApi";

export const useBillingSubscription = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: billingQueryKeys.subscription(),
    queryFn: () => billingApi.getSubscription(),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
};

export const useBillingUsage = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: billingQueryKeys.usage(),
    queryFn: () => billingApi.getUsage(),
    staleTime: 60_000,
    enabled: isAuthenticated,
  });
};

export const useBillingEntitlements = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: billingQueryKeys.entitlements(),
    queryFn: () => billingApi.getEntitlements(),
    staleTime: 60_000,
    enabled: isAuthenticated,
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
