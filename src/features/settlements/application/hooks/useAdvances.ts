import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  invalidateApprovalsRelatedQueries,
  type ApprovalGuards,
  type ApprovalReturnReasonCode,
} from "@features/approvals";
import {
  settlementsApi,
  type ListAdvancesParams,
  type UpdateDriverAdvancePayload,
} from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";
import type { DriverAdvanceFormData } from "../../presentation/validation/settlementSchemas";

/** Refresca anticipos, hub de liquidaciones y bandeja (también tras una guarda ADR-0099). */
export function invalidateAdvanceQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: settlementsQueryKeys.advances(),
  });
  void queryClient.invalidateQueries({
    queryKey: settlementsQueryKeys.all,
  });
  invalidateApprovalsRelatedQueries(queryClient);
}

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
    onSuccess: () => invalidateAdvanceQueries(queryClient),
  });
}

export function useSubmitDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => settlementsApi.submitAdvance(id),
    onSuccess: () => invalidateAdvanceQueries(queryClient),
  });
}

export type ApproveDriverAdvanceVariables = string | { id: string; guards?: ApprovalGuards };

export function useApproveDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: ApproveDriverAdvanceVariables) => {
      const { id, guards } =
        typeof variables === "string" ? { id: variables, guards: undefined } : variables;
      return settlementsApi.approveAdvance(id, guards);
    },
    onSuccess: () => invalidateAdvanceQueries(queryClient),
  });
}

export function useRejectDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      reason,
      guards,
    }: {
      id: string;
      reason: string;
      guards?: ApprovalGuards;
    }) => settlementsApi.rejectAdvance(id, reason, guards),
    onSuccess: () => invalidateAdvanceQueries(queryClient),
  });
}

export function useReturnDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      reason: string;
      reasonCode: ApprovalReturnReasonCode;
      guards?: ApprovalGuards;
    }) => settlementsApi.returnAdvance(id, input),
    onSuccess: () => invalidateAdvanceQueries(queryClient),
  });
}

/** ADR-0099 D17: sin reintento; el 409 lo maneja el Sheet con «Cerrar y recargar». */
export function useUpdateDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDriverAdvancePayload }) =>
      settlementsApi.updateAdvance(id, payload),
    onSuccess: () => invalidateAdvanceQueries(queryClient),
  });
}

export function useCancelDriverAdvance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      settlementsApi.cancelAdvance(id, reason),
    onSuccess: () => invalidateAdvanceQueries(queryClient),
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
    onSuccess: () => invalidateAdvanceQueries(queryClient),
  });
}
