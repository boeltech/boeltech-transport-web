import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { invalidateApprovalsRelatedQueries } from "@features/approvals/application";
import type {
  ApprovalGuards,
  ApprovalReturnReasonCode,
} from "@features/approvals/domain";
import {
  settlementsApi,
  type CreateReimbursementSettlementPayload,
  type ListSettlementsParams,
  type UpdateSettlementPayload,
} from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import type { SettlementStatus } from "../../domain/enums";
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

export function useCreateReimbursementSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReimbursementSettlementPayload) =>
      settlementsApi.createReimbursementSettlement(data),
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

/** Liquidaciones, detalle, anticipos y bandeja (guardas ADR-0099: recargar, no reintentar). */
export function invalidateSettlementQueries(queryClient: QueryClient, id?: string) {
  if (id) {
    queryClient.invalidateQueries({
      queryKey: settlementsQueryKeys.settlementDetail(id),
    });
  }
  queryClient.invalidateQueries({
    queryKey: settlementsQueryKeys.settlements(),
  });
  queryClient.invalidateQueries({
    queryKey: settlementsQueryKeys.advances(),
  });
  invalidateApprovalsRelatedQueries(queryClient);
}

type SettlementDecisionVariables = string | { id: string; guards?: ApprovalGuards };

function decisionTarget(variables: SettlementDecisionVariables): {
  id: string;
  guards?: ApprovalGuards;
} {
  return typeof variables === "string" ? { id: variables } : variables;
}

export function useApproveSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: SettlementDecisionVariables) => {
      const { id, guards } = decisionTarget(variables);
      return guards
        ? settlementsApi.approveSettlement(id, guards)
        : settlementsApi.approveSettlement(id);
    },
    onSuccess: (_, variables) => {
      invalidateSettlementQueries(queryClient, decisionTarget(variables).id);
    },
  });
}

export function useReturnSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      reason,
      reasonCode,
      guards,
    }: {
      id: string;
      reason: string;
      reasonCode: ApprovalReturnReasonCode;
      guards?: ApprovalGuards;
    }) => settlementsApi.returnSettlement(id, { reason, reasonCode, guards }),
    onSuccess: (_, { id }) => {
      invalidateSettlementQueries(queryClient, id);
    },
  });
}

/** E10: tras guardar se vuelve a pedir el detalle antes de decidir o dispersar. */
export function useUpdateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSettlementPayload }) =>
      settlementsApi.updateSettlement(id, payload),
    onSuccess: (_, { id }) => {
      invalidateSettlementQueries(queryClient, id);
    },
  });
}

export function useRejectSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason, guards }: { id: string; reason: string; guards?: ApprovalGuards }) =>
      guards
        ? settlementsApi.rejectSettlement(id, reason, guards)
        : settlementsApi.rejectSettlement(id, reason),
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
    mutationFn: ({
      id,
      reason,
      expectedStatus,
    }: {
      id: string;
      reason?: string;
      expectedStatus?: SettlementStatus;
    }) => settlementsApi.cancelSettlement(id, { reason, expectedStatus }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlementDetail(id),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.settlements(),
      });
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.workbench(),
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
      expectedRevision,
    }: {
      id: string;
      data: DisburseSettlementFormData;
      /** D27: `approval_revision` que vio quien registra el pago. */
      expectedRevision: string;
    }) => settlementsApi.disburseSettlement(id, data, expectedRevision),
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
