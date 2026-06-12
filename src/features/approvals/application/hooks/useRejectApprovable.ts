import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { ApprovableItem, ApprovableType } from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { invalidateApprovalsRelatedQueries } from "../invalidateApprovalsQueries";

export interface RejectApprovableInput {
  type: ApprovableType;
  id: string;
  reason: string;
}

export function useRejectApprovable(
  options?: Omit<
    UseMutationOptions<
      { data: ApprovableItem; message?: string },
      Error,
      RejectApprovableInput
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id, reason }: RejectApprovableInput) =>
      approvalsApi.reject(type, id, reason),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      invalidateApprovalsRelatedQueries(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
