import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type {
  ApprovableType,
  ApprovalDecisionResult,
  ApprovalGuards,
} from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { invalidateApprovalsRelatedQueries } from "../invalidateApprovalsQueries";

export interface RejectApprovableInput {
  type: ApprovableType;
  id: string;
  reason: string;
  guards?: ApprovalGuards;
}

export function useRejectApprovable(
  options?: Omit<
    UseMutationOptions<ApprovalDecisionResult, Error, RejectApprovableInput>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id, reason, guards }: RejectApprovableInput) =>
      approvalsApi.reject(type, id, reason, guards),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      invalidateApprovalsRelatedQueries(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
