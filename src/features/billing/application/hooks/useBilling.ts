import { useQuery } from "@tanstack/react-query";
import { billingQueryKeys, INTERNAL_STAFF_MODULE_CODE } from "../../domain/entities";
import { billingApi } from "../../infrastructure/billingApi";

export const useBillingSubscription = () =>
  useQuery({
    queryKey: billingQueryKeys.subscription(),
    queryFn: () => billingApi.getSubscription(),
    staleTime: 60_000,
  });

export const useBillingUsage = () =>
  useQuery({
    queryKey: billingQueryKeys.usage(),
    queryFn: () => billingApi.getUsage(),
    staleTime: 60_000,
  });

export const useBillingEntitlements = () =>
  useQuery({
    queryKey: billingQueryKeys.entitlements(),
    queryFn: () => billingApi.getEntitlements(),
    staleTime: 60_000,
  });

export const useHasBillingModule = (moduleCode: string) => {
  const query = useBillingEntitlements();
  const hasModule =
    query.data?.effectiveModuleCodes.includes(moduleCode) ?? false;
  return { ...query, hasModule };
};

export const useInternalStaffEntitlement = () =>
  useHasBillingModule(INTERNAL_STAFF_MODULE_CODE);
