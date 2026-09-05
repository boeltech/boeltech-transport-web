import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import { settingsQueryKeys } from "../../domain";
import type {
  CreateBillingServiceConceptPayload,
  UpdateBillingServiceConceptPayload,
} from "../../domain/billingServiceConcept.types";
import {
  createBillingServiceConcept,
  deleteBillingServiceConcept,
  fetchBillingServiceConcepts,
  updateBillingServiceConcept,
} from "../../infrastructure/billingServiceConceptsApi";
import { billingServiceConceptsCopy } from "../../presentation/copy/billingServiceConceptsCopy";

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

export function useCreateBillingServiceConcept() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateBillingServiceConceptPayload) =>
      createBillingServiceConcept(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingServiceConcepts(),
      });
      toast({ title: billingServiceConceptsCopy.toast.created });
    },
    onError: (error: unknown) => {
      const title =
        isApiError(error) && error.code === "DUPLICATE_ENTRY"
          ? billingServiceConceptsCopy.toast.duplicateName
          : billingServiceConceptsCopy.toast.error;
      toast({
        title,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBillingServiceConcept() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBillingServiceConceptPayload;
    }) => updateBillingServiceConcept(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingServiceConcepts(),
      });
      const title =
        variables.payload.isActive === true
          ? billingServiceConceptsCopy.toast.reactivated
          : billingServiceConceptsCopy.toast.updated;
      toast({ title });
    },
    onError: () => {
      toast({
        title: billingServiceConceptsCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBillingServiceConcept() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteBillingServiceConcept(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingServiceConcepts(),
      });
      toast({ title: billingServiceConceptsCopy.toast.deleted });
    },
    onError: () => {
      toast({
        title: billingServiceConceptsCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}
