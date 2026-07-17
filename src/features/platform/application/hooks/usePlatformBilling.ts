import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  platformQueryKeys,
  type GrantPlatformStampPackPayload,
  type MutatePlatformEntitlementPayload,
  type UpsertPlatformTenantSubscriptionPayload,
} from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";

export const usePlatformTenantSubscription = (tenantId: string) =>
  useQuery({
    queryKey: platformQueryKeys.tenantSubscription(tenantId),
    queryFn: () => platformApi.getTenantSubscription(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

export const usePlatformTenantStampUsage = (tenantId: string) =>
  useQuery({
    queryKey: platformQueryKeys.tenantStampUsage(tenantId),
    queryFn: () => platformApi.getTenantStampUsage(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

export const usePlatformTenantEntitlements = (tenantId: string) =>
  useQuery({
    queryKey: platformQueryKeys.tenantEntitlements(tenantId),
    queryFn: () => platformApi.getTenantEntitlements(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

export const usePlatformStampPackCatalog = () =>
  useQuery({
    queryKey: platformQueryKeys.stampPackCatalog(),
    queryFn: () => platformApi.listStampPackCatalog(),
    staleTime: 300_000,
  });

export const usePlatformTenantStampPacks = (tenantId: string) =>
  useQuery({
    queryKey: platformQueryKeys.tenantStampPacks(tenantId),
    queryFn: () => platformApi.getTenantStampPacks(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });

export const usePlatformModules = () =>
  useQuery({
    queryKey: platformQueryKeys.modules(),
    queryFn: () => platformApi.listModules(),
    staleTime: 300_000,
  });

export const useUpsertPlatformTenantSubscription = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.upsertTenantSubscription>>,
      Error,
      { tenantId: string; payload: UpsertPlatformTenantSubscriptionPayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ tenantId, payload }) =>
      platformApi.upsertTenantSubscription(tenantId, payload),
    onSuccess: (result, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantSubscription(variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantDetail(variables.tenantId),
      });
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.tenantLists() });
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantStampUsage(variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantEntitlements(variables.tenantId),
      });
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.metrics() });
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};

export const useMutatePlatformTenantEntitlement = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.mutateTenantEntitlement>>,
      Error,
      { tenantId: string; payload: MutatePlatformEntitlementPayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ tenantId, payload }) =>
      platformApi.mutateTenantEntitlement(tenantId, payload),
    onSuccess: (result, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantEntitlements(variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantSubscription(variables.tenantId),
      });
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};

export const useGrantPlatformStampPack = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.grantTenantStampPack>>,
      Error,
      { tenantId: string; payload: GrantPlatformStampPackPayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ tenantId, payload }) =>
      platformApi.grantTenantStampPack(tenantId, payload),
    onSuccess: (result, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantStampPacks(variables.tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantStampUsage(variables.tenantId),
      });
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};
