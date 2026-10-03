import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type {
  ApprovableType,
  ApprovalDecisionResult,
  ReturnApprovableInput,
} from "../../domain";
import { approvalsApi } from "../../infrastructure";
import { invalidateApprovalsRelatedQueries } from "../invalidateApprovalsQueries";

export interface ReturnApprovableMutationInput extends ReturnApprovableInput {
  type: ApprovableType;
  id: string;
}

/** ADR-0099 «Devolver para corregir»: regresa a quien capturó; reinicia en el paso 1. */
export function useReturnApprovable(
  options?: Omit<
    UseMutationOptions<
      ApprovalDecisionResult,
      Error,
      ReturnApprovableMutationInput
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id, ...input }: ReturnApprovableMutationInput) =>
      approvalsApi.returnForCorrection(type, id, input),
    ...options,
    onSuccess: (data, variables, context, mutation) => {
      invalidateApprovalsRelatedQueries(queryClient);
      options?.onSuccess?.(data, variables, context, mutation);
    },
  });
}
