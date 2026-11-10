import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateApprovalsRelatedQueries } from "@features/approvals/application";
import type {
  CreateSettlementCutPayload,
  PreviewSettlementCutPayload,
} from "../../domain/settlementCut";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import { settlementsQueryKeys } from "../settlementsQueryKeys";

export function useSettlementCutPreview(
  params: PreviewSettlementCutPayload | null,
  options?: { enabled?: boolean },
) {
  const isEnabled =
    options?.enabled !== false &&
    !!params &&
    !!params.periodStart &&
    !!params.periodEnd &&
    !!params.salaryPeriod;

  return useQuery({
    queryKey: params
      ? settlementsQueryKeys.cutPreview(params)
      : [...settlementsQueryKeys.all, "cut-preview", "idle"],
    queryFn: () => {
      if (!params) throw new Error("Params required");
      return settlementsApi.previewSettlementCut(params);
    },
    enabled: isEnabled,
  });
}

export function useCreateSettlementCut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: CreateSettlementCutPayload;
      idempotencyKey: string;
    }) => settlementsApi.createSettlementCut(payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settlementsQueryKeys.all,
      });
      invalidateApprovalsRelatedQueries(queryClient);
    },
  });
}
