import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsQueryKeys } from "../../domain";
import type {
  BillingServiceConcept,
  CreateBillingServiceConceptPayload,
  UpdateBillingServiceConceptPayload,
} from "../../domain/billingServiceConcept.types";
import {
  createBillingServiceConcept,
  deleteBillingServiceConcept,
  fetchBillingServiceConcepts,
  updateBillingServiceConcept,
} from "../../infrastructure/billingServiceConceptsApi";

interface MutationCallbacks<TData = unknown> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
}

type UpdateBillingServiceConceptVariables = {
  id: string;
  payload: UpdateBillingServiceConceptPayload;
};

interface UpdateMutationCallbacks {
  onSuccess?: (
    data: BillingServiceConcept,
    variables: UpdateBillingServiceConceptVariables,
  ) => void;
  onError?: (error: unknown) => void;
}

export function useBillingServiceConcepts(params?: {
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: settingsQueryKeys.billingServiceConcepts(params),
    queryFn: () => fetchBillingServiceConcepts(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBillingServiceConcept(
  callbacks?: MutationCallbacks<BillingServiceConcept>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBillingServiceConceptPayload) =>
      createBillingServiceConcept(payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingServiceConcepts(),
      });
      callbacks?.onSuccess?.(data);
    },
    onError: (error: unknown) => {
      callbacks?.onError?.(error);
    },
  });
}

export function useUpdateBillingServiceConcept(
  callbacks?: UpdateMutationCallbacks,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateBillingServiceConceptVariables) =>
      updateBillingServiceConcept(id, payload),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingServiceConcepts(),
      });
      callbacks?.onSuccess?.(data, variables);
    },
    onError: (error: unknown) => {
      callbacks?.onError?.(error);
    },
  });
}

export function useDeleteBillingServiceConcept(
  callbacks?: MutationCallbacks<void>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBillingServiceConcept(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingServiceConcepts(),
      });
      callbacks?.onSuccess?.(undefined);
    },
    onError: (error: unknown) => {
      callbacks?.onError?.(error);
    },
  });
}
