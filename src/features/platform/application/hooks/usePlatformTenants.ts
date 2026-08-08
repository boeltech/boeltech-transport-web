import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  platformQueryKeys,
  type CreatePlatformTenantPayload,
  type PlatformTenantsQueryParams,
  type RotateAdminCredentialsPayload,
  type UpdateDeclaredFleetPayload,
  type UpdatePlatformTenantStatusPayload,
} from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";

export const usePlatformMetrics = () =>
  useQuery({
    queryKey: platformQueryKeys.metrics(),
    queryFn: () => platformApi.getMetrics(),
    staleTime: 60_000,
  });

export const usePlatformPlans = () =>
  useQuery({
    queryKey: platformQueryKeys.plans(),
    queryFn: () => platformApi.listPlans(),
    staleTime: 300_000,
  });

export const usePlatformTenants = (params?: PlatformTenantsQueryParams) =>
  useQuery({
    queryKey: platformQueryKeys.tenantList(params),
    queryFn: () => platformApi.listTenants(params),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });

export const usePlatformTenant = (id: string) =>
  useQuery({
    queryKey: platformQueryKeys.tenantDetail(id),
    queryFn: async () => {
      const response = await platformApi.getTenantById(id);
      if (!response.data) {
        throw new Error("Tenant no encontrado");
      }
      return response.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });

export const useCreatePlatformTenant = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.createTenant>>,
      Error,
      CreatePlatformTenantPayload
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: (payload: CreatePlatformTenantPayload) =>
      platformApi.createTenant(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.tenantLists() });
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.metrics() });
      onSuccess?.(...args);
    },
    ...restOptions,
  });
};

export const useUpdatePlatformTenantStatus = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.updateTenantStatus>>,
      Error,
      { id: string; payload: UpdatePlatformTenantStatusPayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ id, payload }) =>
      platformApi.updateTenantStatus(id, payload),
    onSuccess: (result, variables, ...rest) => {
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.tenantLists() });
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantDetail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.metrics() });
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};

export const useUpdateDeclaredFleet = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.updateDeclaredFleet>>,
      Error,
      { id: string; payload: UpdateDeclaredFleetPayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ id, payload }) =>
      platformApi.updateDeclaredFleet(id, payload),
    onSuccess: (result, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantDetail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: platformQueryKeys.tenantLists() });
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};

export const useResendPlatformTenantActivation = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.resendAdminActivation>>,
      Error,
      { id: string }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ id }) => platformApi.resendAdminActivation(id),
    onSuccess: (result, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantDetail(variables.id),
      });
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};

export const useRotatePlatformAdminCredentials = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.rotateAdminCredentials>>,
      Error,
      { id: string; payload: RotateAdminCredentialsPayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ id, payload }) =>
      platformApi.rotateAdminCredentials(id, payload),
    onSuccess: (result, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: platformQueryKeys.tenantDetail(variables.id),
      });
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};
