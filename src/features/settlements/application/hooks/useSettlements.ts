import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateApprovalsRelatedQueries } from "@features/approvals";
import {
  settlementsApi,
  type ListSettlementsParams,
} from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import type {
  CreateSettlementFormData,
  DisburseSettlementFormData,
} from "../../presentation/validation/settlementSchemas";

export function useSettlements(
  params: ListSettlementsParams & { enabled?: boolean } = {},
) {
  const { enabled = true, ...queryParams } = params;
  return useQuery({
    queryKey: settlementsQueryKeys.settlementsList(queryParams),
    queryFn: () => settlementsApi.listSettlements(queryParams),
    enabled,
  });
}

export function useSettlementDetail(id: string) {
  return useQuery({
    queryKey: settlementsQueryKeys.settlementDetail(id),
    queryFn: () => settlementsApi.getSettlementById(id),
    enabled: !!id,
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSettlementFormData) =>
      settlementsApi.createSettlement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.all,
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useSubmitSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settlementsApi.submitSettlement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.all,
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useApproveSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settlementsApi.approveSettlement(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlementDetail(id),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlements(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useRejectSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      settlementsApi.rejectSettlement(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlementDetail(id),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlements(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useCancelSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settlementsApi.cancelSettlement(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlementDetail(id),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlements(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useDisburseSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: DisburseSettlementFormData;
    }) => settlementsApi.disburseSettlement(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlementDetail(id),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlements(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}
