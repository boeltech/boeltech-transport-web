import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  platformQueryKeys,
  type IssuePlatformSaasInvoicePayload,
  type MarkPlatformSaasInvoicePaidPayload,
  type PlatformArListQueryParams,
  type VoidPlatformSaasInvoicePayload,
} from "../../domain/entities";
import { platformApi } from "../../infrastructure/platformApi";

function invalidateArQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string,
) {
  queryClient.invalidateQueries({ queryKey: platformQueryKeys.ar() });
  queryClient.invalidateQueries({
    queryKey: platformQueryKeys.tenantSaasInvoices(tenantId),
  });
  queryClient.invalidateQueries({
    queryKey: platformQueryKeys.tenantDetail(tenantId),
  });
  queryClient.invalidateQueries({
    queryKey: platformQueryKeys.tenantSubscription(tenantId),
  });
  queryClient.invalidateQueries({ queryKey: platformQueryKeys.tenantLists() });
}

export const usePlatformArList = (params?: PlatformArListQueryParams) =>
  useQuery({
    queryKey: platformQueryKeys.arList(params),
    queryFn: () => platformApi.listAr(params),
    staleTime: 15_000,
  });

export const usePlatformTenantSaasInvoices = (tenantId: string) =>
  useQuery({
    queryKey: platformQueryKeys.tenantSaasInvoices(tenantId),
    queryFn: () => platformApi.listTenantSaasInvoices(tenantId),
    enabled: !!tenantId,
    staleTime: 15_000,
  });

export const useTenantReconciliationPreview = (
  tenantId: string,
  periodKey: string,
  enabled = true,
) =>
  useQuery({
    queryKey: platformQueryKeys.tenantReconciliationPreview(
      tenantId,
      periodKey,
    ),
    queryFn: () =>
      platformApi.getTenantReconciliationJson(tenantId, periodKey),
    enabled: enabled && !!tenantId && /^\d{4}-\d{2}$/.test(periodKey),
    staleTime: 30_000,
  });

export const useIssueSaasInvoice = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.issueSaasInvoice>>,
      Error,
      { tenantId: string; payload: IssuePlatformSaasInvoicePayload }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ tenantId, payload }) =>
      platformApi.issueSaasInvoice(tenantId, payload),
    onSuccess: (result, variables, ...rest) => {
      invalidateArQueries(queryClient, variables.tenantId);
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};

export const useMarkSaasInvoicePaid = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.markSaasInvoicePaid>>,
      Error,
      {
        tenantId: string;
        invoiceId: string;
        payload: MarkPlatformSaasInvoicePaidPayload;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ tenantId, invoiceId, payload }) =>
      platformApi.markSaasInvoicePaid(tenantId, invoiceId, payload),
    onSuccess: (result, variables, ...rest) => {
      invalidateArQueries(queryClient, variables.tenantId);
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};

export const useVoidSaasInvoice = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.voidSaasInvoice>>,
      Error,
      {
        tenantId: string;
        invoiceId: string;
        payload?: VoidPlatformSaasInvoicePayload;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ tenantId, invoiceId, payload }) =>
      platformApi.voidSaasInvoice(tenantId, invoiceId, payload),
    onSuccess: (result, variables, ...rest) => {
      invalidateArQueries(queryClient, variables.tenantId);
      onSuccess?.(result, variables, ...rest);
    },
    ...restOptions,
  });
};
