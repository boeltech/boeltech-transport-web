import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  platformQueryKeys,
  type IssuePlatformSaasInvoicePayload,
  type IssuePlatformSaasInvoiceDraftPayload,
  type MarkPlatformSaasInvoicePaidPayload,
  type PlatformArListQueryParams,
  type PlatformChargeRunQueryParams,
  type PlatformCloseRunQueryParams,
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
  queryClient.invalidateQueries({
    queryKey: platformQueryKeys.tenantPaymentMethods(tenantId),
  });
  queryClient.invalidateQueries({ queryKey: platformQueryKeys.tenantLists() });
}

export const usePlatformArList = (params?: PlatformArListQueryParams) =>
  useQuery({
    queryKey: platformQueryKeys.arList(params),
    queryFn: () => platformApi.listAr(params),
    staleTime: 15_000,
  });

export const usePlatformArCloseRun = (
  params?: PlatformCloseRunQueryParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: platformQueryKeys.arCloseRun(params),
    queryFn: () => platformApi.getArCloseRun(params),
    staleTime: 15_000,
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });

export const usePlatformArChargeRun = (
  params?: PlatformChargeRunQueryParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: platformQueryKeys.arChargeRun(params),
    queryFn: () => platformApi.getArChargeRun(params),
    staleTime: 15_000,
    placeholderData: (previous) => previous,
    enabled: options?.enabled ?? true,
  });

export type PlatformArView = "pending" | "overdue" | "all";

/** Query params for view-count chips (`pageSize: 1` → `pagination.total`). */
export function arViewCountParams(
  view: PlatformArView,
  filters: Pick<PlatformArListQueryParams, "periodKey" | "tenantId"> = {},
): PlatformArListQueryParams {
  const shared: PlatformArListQueryParams = {
    page: 1,
    pageSize: 1,
    periodKey: filters.periodKey,
    tenantId: filters.tenantId,
  };
  if (view === "pending") return { ...shared, status: "open" };
  if (view === "overdue") {
    return { ...shared, status: "open", minDaysOverdue: 1 };
  }
  return shared;
}

export function usePlatformArViewCounts(
  filters: Pick<PlatformArListQueryParams, "periodKey" | "tenantId"> = {},
) {
  const pending = usePlatformArList(arViewCountParams("pending", filters));
  const overdue = usePlatformArList(arViewCountParams("overdue", filters));
  const all = usePlatformArList(arViewCountParams("all", filters));

  return {
    pending: pending.data?.pagination.total,
    overdue: overdue.data?.pagination.total,
    all: all.data?.pagination.total,
    refetch: () =>
      Promise.all([pending.refetch(), overdue.refetch(), all.refetch()]),
  };
}

export const usePlatformTenantSaasInvoices = (tenantId: string) =>
  useQuery({
    queryKey: platformQueryKeys.tenantSaasInvoices(tenantId),
    queryFn: () => platformApi.listTenantSaasInvoices(tenantId),
    enabled: !!tenantId,
    staleTime: 15_000,
  });

export const usePlatformTenantPaymentMethods = (
  tenantId: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: platformQueryKeys.tenantPaymentMethods(tenantId),
    queryFn: () => platformApi.listTenantPaymentMethods(tenantId),
    enabled: !!tenantId && (options?.enabled ?? true),
    staleTime: 30_000,
    retry: false,
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

export const useIssueSaasInvoiceDraft = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.issueSaasInvoiceDraft>>,
      Error,
      {
        tenantId: string;
        invoiceId: string;
        payload?: IssuePlatformSaasInvoiceDraftPayload;
      }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ tenantId, invoiceId, payload }) =>
      platformApi.issueSaasInvoiceDraft(tenantId, invoiceId, payload),
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

export const useChargeSaasInvoiceStripe = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof platformApi.chargeSaasInvoiceStripe>>,
      Error,
      { tenantId: string; invoiceId: string }
    >,
    "mutationFn"
  >,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};
  return useMutation({
    mutationFn: ({ tenantId, invoiceId }) =>
      platformApi.chargeSaasInvoiceStripe(tenantId, invoiceId),
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
