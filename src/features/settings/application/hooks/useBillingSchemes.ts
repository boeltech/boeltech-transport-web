import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { settingsQueryKeys } from "../../domain";
import type {
  CreateBillingSchemePayload,
  UpdateBillingSchemePayload,
} from "../../domain/billingScheme.types";
import {
  createBillingScheme,
  deleteBillingScheme,
  fetchBillingSchemeById,
  fetchBillingSchemes,
  updateBillingScheme,
} from "../../infrastructure/billingSchemesApi";
import { billingSchemesCopy } from "../../presentation/copy/billingSchemesCopy";

export function useBillingSchemes(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: settingsQueryKeys.billingSchemes(params),
    queryFn: () => fetchBillingSchemes({ isActive: params?.isActive, limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBillingScheme(id: string | undefined) {
  return useQuery({
    queryKey: settingsQueryKeys.billingScheme(id ?? ""),
    queryFn: () => fetchBillingSchemeById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBillingScheme() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateBillingSchemePayload) =>
      createBillingScheme(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingSchemes(),
      });
      toast({ title: billingSchemesCopy.toast.created });
    },
    onError: () => {
      toast({
        title: billingSchemesCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBillingScheme() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBillingSchemePayload;
    }) => updateBillingScheme(id, payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingSchemes(),
      });
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingScheme(variables.id),
      });
      toast({ title: billingSchemesCopy.toast.updated });
    },
    onError: () => {
      toast({
        title: billingSchemesCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBillingScheme() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteBillingScheme(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.billingSchemes(),
      });
      toast({ title: billingSchemesCopy.toast.deleted });
    },
    onError: () => {
      toast({
        title: billingSchemesCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}
