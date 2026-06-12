import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { BulkOperation, BulkResult } from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { invalidateApprovalsRelatedQueries } from "../invalidateApprovalsQueries";

export function useBulkApprovals(
  options?: Omit<
    UseMutationOptions<
      { data: BulkResult; message: string },
      Error,
      BulkOperation[]
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operations: BulkOperation[]) => approvalsApi.bulk(operations),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      invalidateApprovalsRelatedQueries(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
