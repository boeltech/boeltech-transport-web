import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateApprovalsRelatedQueries } from "@features/approvals";
import { settlementsApi, type ListAdvancesParams } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import type { DriverAdvanceFormData } from "../../presentation/validation/settlementSchemas";

export function useDriverAdvances(params: ListAdvancesParams = {}) {
  return useQuery({
    queryKey: settlementsQueryKeys.advancesList(params),
    queryFn: () => settlementsApi.listAdvances(params),
  });
}

export function useDriverAdvanceDetail(id: string) {
  return useQuery({
    queryKey: settlementsQueryKeys.advanceDetail(id),
    queryFn: () => settlementsApi.getAdvanceById(id),
    enabled: !!id,
  });
}

export function useCreateDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DriverAdvanceFormData) =>
      settlementsApi.createAdvance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.all,
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useSubmitDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settlementsApi.submitAdvance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.all,
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useApproveDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settlementsApi.approveAdvance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.all,
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useRejectDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      settlementsApi.rejectAdvance(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.all,
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}

export function useDisburseDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { paymentMethod?: string; bankReference?: string; disbursedAt?: string };
    }) => settlementsApi.disburseAdvance(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.advances(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.all,
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}
