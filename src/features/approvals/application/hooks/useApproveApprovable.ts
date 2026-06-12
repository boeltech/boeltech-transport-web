import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { ApprovableItem, ApprovableType } from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { invalidateApprovalsRelatedQueries } from "../invalidateApprovalsQueries";

export interface ApproveApprovableInput {
  type: ApprovableType;
  id: string;
}

export function useApproveApprovable(
  options?: Omit<
    UseMutationOptions<
      { data: ApprovableItem; message?: string },
      Error,
      ApproveApprovableInput
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id }: ApproveApprovableInput) =>
      approvalsApi.approve(type, id),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      invalidateApprovalsRelatedQueries(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
