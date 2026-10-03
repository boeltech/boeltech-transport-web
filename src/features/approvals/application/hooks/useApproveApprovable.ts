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

export interface ApproveApprovableInput {
  type: ApprovableType;
  id: string;
  /** ADR-0099: paso y versión que vio quien firma. */
  guards?: ApprovalGuards;
}

export function useApproveApprovable(
  options?: Omit<
    UseMutationOptions<ApprovalDecisionResult, Error, ApproveApprovableInput>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id, guards }: ApproveApprovableInput) =>
      approvalsApi.approve(type, id, guards),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      invalidateApprovalsRelatedQueries(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
