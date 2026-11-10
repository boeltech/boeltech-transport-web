import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settlementsApi } from "../../infrastructure/settlementsApi";
import type {
  BatchApproveSettlementsPayload,
  BatchDisburseSettlementsPayload,
  BatchRejectSettlementsPayload,
} from "../../domain/settlementBatch";
import { invalidateSettlementQueries } from "../invalidateSettlementsQueries";

function invalidateBatch(queryClient: ReturnType<typeof useQueryClient>) {
  invalidateSettlementQueries(queryClient);
}

/** POST /settlements/batch/approve — F7 */
export function useBatchApproveSettlements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchApproveSettlementsPayload) =>
      settlementsApi.batchApproveSettlements(payload),
    onSuccess: () => invalidateBatch(queryClient),
  });
}

/** POST /settlements/batch/reject — F7 */
export function useBatchRejectSettlements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchRejectSettlementsPayload) =>
      settlementsApi.batchRejectSettlements(payload),
    onSuccess: () => invalidateBatch(queryClient),
  });
}

/** POST /settlements/batch/disburse — F7 (sin operational-cash-ledger). */
export function useBatchDisburseSettlements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchDisburseSettlementsPayload) =>
      settlementsApi.batchDisburseSettlements(payload),
    onSuccess: () => invalidateBatch(queryClient),
  });
}
